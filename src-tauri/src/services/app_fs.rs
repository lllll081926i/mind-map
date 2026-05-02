use crate::services::{app_state, file_association::PendingAssociatedFiles};
use serde::Serialize;
use std::path::{Component, Path, PathBuf};
use tauri::Manager;

const PROJECT_EXTENSIONS: &[&str] = &[".smm", ".xmind", ".md", ".json"];
const TEXT_WRITE_EXTENSIONS: &[&str] = &[
  ".smm",
  ".xmind",
  ".md",
  ".json",
  ".txt",
  ".html",
  ".svg",
];
const BINARY_WRITE_EXTENSIONS: &[&str] = &[".png", ".jpg", ".jpeg", ".pdf"];
const MAX_TEXT_FILE_SIZE: u64 = 50 * 1024 * 1024;
const RESERVED_WINDOWS_NAMES: &[&str] = &[
  "con", "prn", "aux", "nul", "com1", "com2", "com3", "com4", "com5", "com6",
  "com7", "com8", "com9", "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6",
  "lpt7", "lpt8", "lpt9",
];

fn is_path_safe(path: &str) -> bool {
  if path.trim().is_empty() || path.contains('\0') {
    return false;
  }

  let candidate_path = Path::new(path);
  !candidate_path.components().any(|component| {
    if matches!(component, Component::ParentDir) {
      return true;
    }
    match component {
      Component::Normal(value) => {
        let normalized = value
          .to_string_lossy()
          .trim_end_matches([' ', '.'])
          .to_lowercase();
        RESERVED_WINDOWS_NAMES.contains(&normalized.as_str())
      }
      _ => false,
    }
  })
}

fn normalize_windows_path_prefix(path: &Path) -> PathBuf {
  let raw = path.to_string_lossy();
  if let Some(rest) = raw.strip_prefix("\\\\?\\UNC\\") {
    return PathBuf::from(format!("\\\\{rest}"));
  }
  if let Some(rest) = raw.strip_prefix("\\\\?\\") {
    return PathBuf::from(rest);
  }
  path.to_path_buf()
}

fn has_extension_from(path: &str, allowed_extensions: &[&str]) -> bool {
  let extension = Path::new(path)
    .extension()
    .and_then(|value| value.to_str())
    .map(|value| format!(".{}", value.to_lowercase()));
  match extension {
    Some(ext) => allowed_extensions.iter().any(|allowed| *allowed == ext),
    None => false,
  }
}

fn has_project_extension(path: &str) -> bool {
  has_extension_from(path, PROJECT_EXTENSIONS)
}

fn has_text_write_extension(path: &str) -> bool {
  has_extension_from(path, TEXT_WRITE_EXTENSIONS)
}

fn has_binary_write_extension(path: &str) -> bool {
  has_extension_from(path, BINARY_WRITE_EXTENSIONS)
}

fn has_supported_scope_extension(path: &str) -> bool {
  has_project_extension(path)
    || has_text_write_extension(path)
    || has_binary_write_extension(path)
}

fn normalize_directory_scope(path: &str) -> Option<PathBuf> {
  let value = path.trim();
  if value.is_empty() {
    return None;
  }
  let path_buf = PathBuf::from(value);
  if has_supported_scope_extension(value) {
    return path_buf.parent().map(|parent| parent.to_path_buf());
  }
  Some(path_buf)
}

async fn collect_allowed_directory_roots(app: &tauri::AppHandle) -> Result<Vec<PathBuf>, String> {
  let mut roots = Vec::new();
  if let Ok(app_data_dir) = app.path().app_data_dir() {
    eprintln!("[MindMap] 允许的目录根节点 (app_data_dir): {}", app_data_dir.display());
    roots.push(app_data_dir);
  } else {
    eprintln!("[MindMap] 警告: 无法获取 app_data_dir");
  }
  
  let meta_state = match app_state::read_meta_state_raw(app).await {
    Ok(state) => state,
    Err(error) => {
      eprintln!(
        "[MindMap] 警告: 读取工作区状态失败，目录权限校验回退到 app_data_dir: {}",
        error
      );
      app_state::DesktopMetaState::default()
    }
  };
  if let Some(path) = normalize_directory_scope(&meta_state.last_directory) {
    eprintln!("[MindMap] 允许的目录根节点 (last_directory): {}", path.display());
    roots.push(path);
  }
  if let Some(current_document) = meta_state.current_document.as_ref() {
    if let Some(path) = current_document.get("path").and_then(|value| value.as_str()) {
      if let Some(scope) = normalize_directory_scope(path) {
        eprintln!("[MindMap] 允许的目录根节点 (current_document): {}", scope.display());
        roots.push(scope);
      }
    }
  }
  meta_state.recent_files.iter().for_each(|item| {
    if let Some(scope) = normalize_directory_scope(&item.path) {
      eprintln!("[MindMap] 允许的目录根节点 (recent_files): {}", scope.display());
      roots.push(scope);
    }
  });
  let pending_associated_files = app.state::<PendingAssociatedFiles>();
  pending_associated_files.take_paths().into_iter().for_each(|path| {
    if let Some(scope) = normalize_directory_scope(&path) {
      eprintln!(
        "[MindMap] 允许的目录根节点 (pending_associated_files): {}",
        scope.display()
      );
      roots.push(scope);
    }
    pending_associated_files.push_paths(vec![path]);
  });

  let mut result = Vec::new();
  for root in roots {
    match tokio::fs::canonicalize(&root).await {
      Ok(canonical) => {
        let normalized = normalize_windows_path_prefix(&canonical);
        if !result.iter().any(|item| item == &normalized) {
          result.push(normalized);
        }
      }
      Err(e) => {
        eprintln!("[MindMap] 警告: 无法规范化路径 {}: {}", root.display(), e);
        if root.exists() {
          let normalized = normalize_windows_path_prefix(&root);
          if !result.iter().any(|item| item == &normalized) {
            result.push(normalized);
          }
        }
      }
    }
  }
  eprintln!("[MindMap] 最终允许的目录根节点数量: {}", result.len());
  Ok(result)
}

async fn ensure_directory_scope_allowed(
  app: &tauri::AppHandle,
  path: &str,
) -> Result<(), String> {
  let allowed_roots = collect_allowed_directory_roots(app).await?;
  if allowed_roots.is_empty() {
    eprintln!("[MindMap] 警告: 没有可用的目录访问授权，拒绝访问");
    return Err("没有可用的目录访问授权".into());
  }

  let requested_path = Path::new(path);
  let mut path_to_check = if requested_path.exists() {
    requested_path.to_path_buf()
  } else {
    requested_path
      .parent()
      .map(|parent| parent.to_path_buf())
      .unwrap_or_else(|| requested_path.to_path_buf())
  };
  while !path_to_check.exists() {
    let Some(parent) = path_to_check.parent() else {
      break;
    };
    path_to_check = parent.to_path_buf();
  }

  let canonical_path = tokio::fs::canonicalize(&path_to_check)
    .await
    .map(|canonical| normalize_windows_path_prefix(&canonical))
    .map_err(|error| {
      format!(
        "无法规范化路径 '{}' (检查路径 '{}'): {}",
        path,
        path_to_check.display(),
        error
      )
    })?;

  eprintln!("[MindMap] 检查路径权限: {} (规范化后: {})", path, canonical_path.display());

  let is_allowed = allowed_roots.iter().any(|root| {
    canonical_path == *root || canonical_path.starts_with(root)
  });
  if is_allowed {
    Ok(())
  } else {
    let allowed_paths: Vec<String> = allowed_roots.iter().map(|p| p.display().to_string()).collect();
    Err(format!("无权访问该目录 '{}'。允许的根目录: {}", path, allowed_paths.join(", ")))
  }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryEntry {
  pub id: String,
  pub name: String,
  pub r#type: String,
  pub mode: String,
  pub path: String,
  pub leaf: bool,
  pub enable_edit: bool,
}

pub async fn read_text_file(app: &tauri::AppHandle, path: &str) -> Result<String, String> {
  if !has_project_extension(path) && !has_text_write_extension(path) {
    return Err("不支持的文件类型".into());
  }
  if !is_path_safe(path) {
    return Err("无效的路径".into());
  }
  ensure_directory_scope_allowed(app, path).await?;
  let metadata = tokio::fs::metadata(path)
    .await
    .map_err(|error| error.to_string())?;
  if metadata.len() > MAX_TEXT_FILE_SIZE {
    return Err("文件过大，暂不支持读取超过 50 MB 的文本文件".into());
  }
  tokio::fs::read_to_string(path)
    .await
    .map_err(|error| error.to_string())
}

pub async fn write_text_file(
  app: &tauri::AppHandle,
  path: &str,
  content: &str,
) -> Result<(), String> {
  if !has_text_write_extension(path) {
    return Err("不支持的文件类型".into());
  }
  if !is_path_safe(path) {
    return Err("无效的路径".into());
  }
  ensure_directory_scope_allowed(app, path).await?;
  if let Some(parent) = Path::new(path).parent() {
    tokio::fs::create_dir_all(parent)
      .await
      .map_err(|error| format!("创建目标目录失败: {}", error))?;
    let metadata = tokio::fs::metadata(parent)
      .await
      .map_err(|_| "目标目录不存在".to_string())?;
    if !metadata.is_dir() {
      return Err("目标目录不可用".into());
    }
  }
  tokio::fs::write(path, content)
    .await
    .map_err(|error| error.to_string())
}

pub async fn write_binary_file(
  app: &tauri::AppHandle,
  path: &str,
  content: &[u8],
) -> Result<(), String> {
  if !has_binary_write_extension(path) {
    return Err("不支持的文件类型".into());
  }
  if !is_path_safe(path) {
    return Err("无效的路径".into());
  }
  ensure_directory_scope_allowed(app, path).await?;
  if let Some(parent) = Path::new(path).parent() {
    tokio::fs::create_dir_all(parent)
      .await
      .map_err(|error| format!("创建目标目录失败: {}", error))?;
    let metadata = tokio::fs::metadata(parent)
      .await
      .map_err(|_| "目标目录不存在".to_string())?;
    if !metadata.is_dir() {
      return Err("目标目录不可用".into());
    }
  }
  tokio::fs::write(path, content)
    .await
    .map_err(|error| error.to_string())
}

pub async fn list_directory_entries(
  app: &tauri::AppHandle,
  path: &str,
) -> Result<Vec<DirectoryEntry>, String> {
  if !is_path_safe(path) {
    return Err("无效的路径".into());
  }
  ensure_directory_scope_allowed(app, path).await?;
  let mut entries = tokio::fs::read_dir(path)
    .await
    .map_err(|error| error.to_string())?;
  let mut dir_list = Vec::new();
  let mut file_list = Vec::new();

  while let Some(entry) = entries.next_entry().await.map_err(|error| error.to_string())? {
    let entry_path = normalize_windows_path_prefix(&entry.path());
    let metadata = entry.metadata().await.map_err(|error| error.to_string())?;
    let name = entry.file_name().to_string_lossy().to_string();
    let is_file = metadata.is_file();
    if is_file && !has_project_extension(&name) {
      continue;
    }
    let data = DirectoryEntry {
      id: entry_path.to_string_lossy().to_string(),
      name: name.clone(),
      r#type: if is_file { "file".into() } else { "directory".into() },
      mode: "desktop".into(),
      path: entry_path.to_string_lossy().to_string(),
      leaf: is_file,
      enable_edit: is_file && {
        matches!(
          entry_path.extension().and_then(|value| value.to_str()),
          Some("smm") | Some("SMM") | Some("json") | Some("JSON")
        )
      },
    };
    if is_file {
      file_list.push(data);
    } else {
      dir_list.push(data);
    }
  }

  dir_list.sort_by(|left, right| left.name.cmp(&right.name));
  file_list.sort_by(|left, right| left.name.cmp(&right.name));
  dir_list.extend(file_list);
  Ok(dir_list)
}
