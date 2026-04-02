use crate::services::app_state;
use serde::Serialize;
use std::path::{Component, Path, PathBuf};
use tauri::Manager;

const ALLOWED_EXTENSIONS: &[&str] = &[".smm", ".xmind", ".md", ".json"];
const MAX_TEXT_FILE_SIZE: u64 = 50 * 1024 * 1024;
const RESERVED_WINDOWS_NAMES: &[&str] = &[
  "con", "prn", "aux", "nul", "com1", "com2", "com3", "com4", "com5", "com6",
  "com7", "com8", "com9", "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6",
  "lpt7", "lpt8", "lpt9",
];

fn is_path_safe(path: &str) -> bool {
  if path.trim().is_empty() || path.contains('\0') || path.contains("\\\\?\\") {
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

fn has_allowed_extension(path: &str) -> bool {
  let extension = Path::new(path)
    .extension()
    .and_then(|value| value.to_str())
    .map(|value| format!(".{}", value.to_lowercase()));
  match extension {
    Some(ext) => ALLOWED_EXTENSIONS.iter().any(|allowed| *allowed == ext),
    None => false,
  }
}

fn normalize_directory_scope(path: &str) -> Option<PathBuf> {
  let value = path.trim();
  if value.is_empty() {
    return None;
  }
  let path_buf = PathBuf::from(value);
  if has_allowed_extension(value) {
    return path_buf.parent().map(|parent| parent.to_path_buf());
  }
  Some(path_buf)
}

async fn collect_allowed_directory_roots(app: &tauri::AppHandle) -> Result<Vec<PathBuf>, String> {
  let mut roots = Vec::new();
  if let Ok(app_data_dir) = app.path().app_data_dir() {
    roots.push(app_data_dir);
  }
  let meta_state = app_state::read_meta_state_raw(app).await?;
  if let Some(path) = normalize_directory_scope(&meta_state.last_directory) {
    roots.push(path);
  }
  if let Some(current_document) = meta_state.current_document.as_ref() {
    if let Some(path) = current_document.get("path").and_then(|value| value.as_str()) {
      if let Some(scope) = normalize_directory_scope(path) {
        roots.push(scope);
      }
    }
  }
  meta_state.recent_files.iter().for_each(|item| {
    if let Some(scope) = normalize_directory_scope(&item.path) {
      roots.push(scope);
    }
  });

  let mut result = Vec::new();
  for root in roots {
    if let Ok(canonical) = std::fs::canonicalize(&root) {
      if !result.iter().any(|item| item == &canonical) {
        result.push(canonical);
      }
    }
  }
  Ok(result)
}

async fn ensure_directory_scope_allowed(
  app: &tauri::AppHandle,
  path: &str,
) -> Result<(), String> {
  let allowed_roots = collect_allowed_directory_roots(app).await?;
  if allowed_roots.is_empty() {
    return Ok(());
  }
  let canonical_path = std::fs::canonicalize(path).map_err(|error| error.to_string())?;
  let is_allowed = allowed_roots.iter().any(|root| {
    canonical_path == *root || canonical_path.starts_with(root)
  });
  if is_allowed {
    Ok(())
  } else {
    Err("无权访问该目录".into())
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

pub async fn read_text_file(path: &str) -> Result<String, String> {
  if !has_allowed_extension(path) {
    return Err("不支持的文件类型".into());
  }
  if !is_path_safe(path) {
    return Err("无效的路径".into());
  }
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

pub async fn write_text_file(path: &str, content: &str) -> Result<(), String> {
  if !has_allowed_extension(path) {
    return Err("不支持的文件类型".into());
  }
  if !is_path_safe(path) {
    return Err("无效的路径".into());
  }
  if let Some(parent) = Path::new(path).parent() {
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
    let entry_path = entry.path();
    let metadata = entry.metadata().await.map_err(|error| error.to_string())?;
    let name = entry.file_name().to_string_lossy().to_string();
    let is_file = metadata.is_file();
    if is_file && !has_allowed_extension(&name) {
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
