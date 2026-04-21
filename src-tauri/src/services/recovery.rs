use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::{
  collections::hash_map::DefaultHasher,
  hash::{Hash, Hasher},
  path::{Path, PathBuf},
};
use tauri::Manager;

const RECOVERY_DIR_NAME: &str = "recovery";
const RECOVERY_INDEX_FILE_NAME: &str = "index.json";
const RECOVERY_DRAFTS_DIR_NAME: &str = "drafts";
const RECOVERY_PROBE_FILE_NAME: &str = ".write-probe.tmp";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryIndexEntry {
  pub document_id: String,
  pub title: String,
  pub source_path: String,
  pub updated_at: u64,
  pub dirty: bool,
  pub draft_file: String,
  pub origin: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryState {
  pub root_path: String,
  pub origin: String,
  pub entries: Vec<RecoveryIndexEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
#[serde(default)]
pub struct RecoveryDraft {
  pub document_id: String,
  pub title: String,
  pub source_path: String,
  pub updated_at: u64,
  pub dirty: bool,
  pub document_mode: String,
  pub draft_file: String,
  pub origin: String,
  pub is_full_data_file: bool,
  pub mind_map_data: serde_json::Value,
  pub mind_map_config: Option<serde_json::Value>,
  pub flowchart_data: serde_json::Value,
  pub flowchart_config: Option<serde_json::Value>,
  pub file_ref: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
#[serde(default)]
pub struct RecoveryDraftInput {
  pub source_path: String,
  pub title: String,
  #[serde(default)]
  pub dirty: bool,
  #[serde(default)]
  pub updated_at: u64,
  #[serde(default)]
  pub is_full_data_file: bool,
  pub document_mode: String,
  pub mind_map_data: serde_json::Value,
  pub mind_map_config: Option<serde_json::Value>,
  pub flowchart_data: serde_json::Value,
  pub flowchart_config: Option<serde_json::Value>,
  pub file_ref: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryClearResult {
  pub root_path: String,
  pub origin: String,
  pub deleted_count: usize,
  pub failed_count: usize,
}

#[derive(Debug, Clone)]
struct RecoveryRoot {
  root_path: PathBuf,
  origin: String,
}

fn current_timestamp_millis() -> u64 {
  std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .map(|duration| duration.as_millis() as u64)
    .unwrap_or(0)
}

fn normalize_document_path(path: &str) -> String {
  path.trim().replace('\\', "/").to_lowercase()
}

fn build_document_id(source_path: &str) -> Result<String, String> {
  let normalized = normalize_document_path(source_path);
  if normalized.is_empty() {
    return Err("恢复文件来源路径不能为空".into());
  }
  let mut hasher = DefaultHasher::new();
  normalized.hash(&mut hasher);
  Ok(format!("{:016x}", hasher.finish()))
}

fn recovery_dir_path(root_path: &Path) -> PathBuf {
  root_path.join(RECOVERY_DIR_NAME)
}

fn recovery_index_path(root_path: &Path) -> PathBuf {
  recovery_dir_path(root_path).join(RECOVERY_INDEX_FILE_NAME)
}

fn recovery_drafts_dir_path(root_path: &Path) -> PathBuf {
  recovery_dir_path(root_path).join(RECOVERY_DRAFTS_DIR_NAME)
}

fn recovery_draft_path(root_path: &Path, draft_file: &str) -> PathBuf {
  recovery_drafts_dir_path(root_path).join(draft_file)
}

async fn source_file_is_newer_or_equal(source_path: &str, updated_at: u64) -> bool {
  let Ok(metadata) = tokio::fs::metadata(source_path).await else {
    return false;
  };
  let Ok(modified_at) = metadata.modified() else {
    return false;
  };
  let Ok(duration) = modified_at.duration_since(std::time::UNIX_EPOCH) else {
    return false;
  };
  duration.as_millis() as u64 >= updated_at
}

async fn ensure_root_writable(root_path: &Path) -> Result<(), String> {
  let recovery_dir = recovery_dir_path(root_path);
  tokio::fs::create_dir_all(&recovery_dir)
    .await
    .map_err(|error| format!("创建恢复目录失败 ({}): {}", recovery_dir.display(), error))?;
  let probe_path = recovery_dir.join(RECOVERY_PROBE_FILE_NAME);
  tokio::fs::write(&probe_path, b"ok")
    .await
    .map_err(|error| format!("恢复目录不可写 ({}): {}", recovery_dir.display(), error))?;
  let _ = tokio::fs::remove_file(&probe_path).await;
  Ok(())
}

async fn resolve_recovery_root(app: &tauri::AppHandle) -> Result<RecoveryRoot, String> {
  let preferred_root = app.path().resource_dir().ok();
  if let Some(root_path) = preferred_root {
    if ensure_root_writable(&root_path).await.is_ok() {
      return Ok(RecoveryRoot {
        root_path,
        origin: "app-directory".into(),
      });
    }
  }

  let fallback_root = app
    .path()
    .app_data_dir()
    .map_err(|error| format!("获取用户数据目录失败: {}", error))?;
  ensure_root_writable(&fallback_root).await?;
  Ok(RecoveryRoot {
    root_path: fallback_root,
    origin: "user-data-fallback".into(),
  })
}

async fn read_json_file<T>(path: PathBuf, default_value: T) -> Result<T, String>
where
  T: DeserializeOwned + Clone,
{
  if !tokio::fs::try_exists(&path)
    .await
    .map_err(|error| format!("检查文件失败 ({}): {}", path.display(), error))?
  {
    return Ok(default_value);
  }
  let content = tokio::fs::read(&path)
    .await
    .map_err(|error| format!("读取文件失败 ({}): {}", path.display(), error))?;
  if content.is_empty() {
    return Ok(default_value);
  }
  match serde_json::from_slice(&content) {
    Ok(value) => Ok(value),
    Err(error) => {
      eprintln!(
        "[MindMap] 警告: 恢复文件解析失败 {}: {}，回退默认值",
        path.display(),
        error
      );
      Ok(default_value)
    }
  }
}

async fn write_json_file<T>(path: PathBuf, value: &T) -> Result<(), String>
where
  T: Serialize + ?Sized,
{
  if let Some(parent) = path.parent() {
    tokio::fs::create_dir_all(parent)
      .await
      .map_err(|error| format!("创建目录失败 ({}): {}", parent.display(), error))?;
  }
  let content = serde_json::to_vec_pretty(value).map_err(|error| error.to_string())?;
  let temp_path = path.with_extension("json.tmp");
  let backup_path = path.with_extension("json.bak");
  tokio::fs::write(&temp_path, content)
    .await
    .map_err(|error| format!("写入临时恢复文件失败: {}", error))?;

  let mut original_backed_up = false;
  if tokio::fs::try_exists(&path)
    .await
    .map_err(|error| format!("检查恢复文件失败 ({}): {}", path.display(), error))?
  {
    let _ = tokio::fs::remove_file(&backup_path).await;
    tokio::fs::rename(&path, &backup_path)
      .await
      .map_err(|error| format!("备份恢复文件失败: {}", error))?;
    original_backed_up = true;
  }

  if let Err(error) = tokio::fs::rename(&temp_path, &path).await {
    let _ = tokio::fs::remove_file(&temp_path).await;
    if original_backed_up {
      let _ = tokio::fs::rename(&backup_path, &path).await;
    }
    return Err(format!("替换恢复文件失败: {}", error));
  }

  if original_backed_up {
    let _ = tokio::fs::remove_file(&backup_path).await;
  }

  Ok(())
}

async fn read_recovery_entries(root: &RecoveryRoot) -> Result<Vec<RecoveryIndexEntry>, String> {
  read_json_file(recovery_index_path(&root.root_path), Vec::<RecoveryIndexEntry>::new()).await
}

async fn write_recovery_entries(
  root: &RecoveryRoot,
  entries: &[RecoveryIndexEntry],
) -> Result<(), String> {
  write_json_file(recovery_index_path(&root.root_path), entries).await
}

fn sort_entries(entries: &mut [RecoveryIndexEntry]) {
  entries.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
}

async fn prune_missing_entries(
  root: &RecoveryRoot,
  entries: Vec<RecoveryIndexEntry>,
) -> Result<Vec<RecoveryIndexEntry>, String> {
  let mut next_entries = Vec::with_capacity(entries.len());
  let mut changed = false;
  for entry in entries {
    let draft_path = recovery_draft_path(&root.root_path, &entry.draft_file);
    let exists = tokio::fs::try_exists(&draft_path)
      .await
      .map_err(|error| format!("检查恢复草稿失败 ({}): {}", draft_path.display(), error))?;
    if exists {
      next_entries.push(entry);
    } else {
      changed = true;
    }
  }
  if changed {
    write_recovery_entries(root, &next_entries).await?;
  }
  Ok(next_entries)
}

pub async fn read_recovery_state(app: &tauri::AppHandle) -> Result<RecoveryState, String> {
  let root = resolve_recovery_root(app).await?;
  let entries = prune_missing_entries(&root, read_recovery_entries(&root).await?).await?;
  Ok(RecoveryState {
    root_path: root.root_path.to_string_lossy().to_string(),
    origin: root.origin,
    entries,
  })
}

pub async fn read_recovery_draft(
  app: &tauri::AppHandle,
  source_path: &str,
) -> Result<Option<RecoveryDraft>, String> {
  let document_id = build_document_id(source_path)?;
  let root = resolve_recovery_root(app).await?;
  let entries = read_recovery_entries(&root).await?;
  let Some(entry) = entries.into_iter().find(|item| item.document_id == document_id) else {
    return Ok(None);
  };
  let draft_path = recovery_draft_path(&root.root_path, &entry.draft_file);
  let exists = tokio::fs::try_exists(&draft_path)
    .await
    .map_err(|error| format!("检查恢复草稿失败 ({}): {}", draft_path.display(), error))?;
  if !exists {
    return Ok(None);
  }
  let draft = read_json_file::<RecoveryDraft>(draft_path, RecoveryDraft {
    document_id: entry.document_id.clone(),
    title: entry.title.clone(),
    source_path: entry.source_path.clone(),
    updated_at: entry.updated_at,
    dirty: entry.dirty,
    document_mode: String::from("mindmap"),
    draft_file: entry.draft_file.clone(),
    origin: entry.origin.clone(),
    is_full_data_file: false,
    mind_map_data: serde_json::Value::Null,
    mind_map_config: None,
    flowchart_data: serde_json::Value::Null,
    flowchart_config: None,
    file_ref: None,
  })
  .await?;
  if source_file_is_newer_or_equal(source_path, draft.updated_at).await {
    let _ = clear_recovery_draft(app, source_path).await;
    return Ok(None);
  }
  Ok(Some(draft))
}

pub async fn write_recovery_draft(
  app: &tauri::AppHandle,
  input: RecoveryDraftInput,
) -> Result<RecoveryDraft, String> {
  let root = resolve_recovery_root(app).await?;
  let document_id = build_document_id(&input.source_path)?;
  let draft_file = format!("{document_id}.json");
  let updated_at = if input.updated_at > 0 {
    input.updated_at
  } else {
    current_timestamp_millis()
  };
  let draft = RecoveryDraft {
    document_id: document_id.clone(),
    title: input.title.trim().to_string(),
    source_path: input.source_path.trim().to_string(),
    updated_at,
    dirty: input.dirty,
    document_mode: if input.document_mode.trim() == "flowchart" {
      String::from("flowchart")
    } else {
      String::from("mindmap")
    },
    draft_file: draft_file.clone(),
    origin: root.origin.clone(),
    is_full_data_file: input.is_full_data_file,
    mind_map_data: input.mind_map_data,
    mind_map_config: input.mind_map_config,
    flowchart_data: input.flowchart_data,
    flowchart_config: input.flowchart_config,
    file_ref: input.file_ref,
  };
  write_json_file(recovery_draft_path(&root.root_path, &draft_file), &draft).await?;
  let mut entries = read_recovery_entries(&root).await?;
  entries.retain(|entry| entry.document_id != document_id);
  entries.push(RecoveryIndexEntry {
    document_id,
    title: draft.title.clone(),
    source_path: draft.source_path.clone(),
    updated_at: draft.updated_at,
    dirty: draft.dirty,
    draft_file,
    origin: root.origin.clone(),
  });
  sort_entries(&mut entries);
  write_recovery_entries(&root, &entries).await?;
  Ok(draft)
}

pub async fn clear_recovery_draft(
  app: &tauri::AppHandle,
  source_path: &str,
) -> Result<RecoveryClearResult, String> {
  let document_id = build_document_id(source_path)?;
  let root = resolve_recovery_root(app).await?;
  let mut entries = read_recovery_entries(&root).await?;
  let mut deleted_count = 0usize;
  let mut failed_count = 0usize;
  let entry = entries
    .iter()
    .find(|item| item.document_id == document_id)
    .cloned();

  if let Some(entry) = entry {
    let draft_path = recovery_draft_path(&root.root_path, &entry.draft_file);
    match tokio::fs::remove_file(&draft_path).await {
      Ok(_) => {
        deleted_count += 1;
      }
      Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
      Err(_) => {
        failed_count += 1;
      }
    }
    entries.retain(|item| item.document_id != document_id);
    write_recovery_entries(&root, &entries).await?;
  }

  Ok(RecoveryClearResult {
    root_path: root.root_path.to_string_lossy().to_string(),
    origin: root.origin,
    deleted_count,
    failed_count,
  })
}

pub async fn clear_all_recovery_drafts(
  app: &tauri::AppHandle,
) -> Result<RecoveryClearResult, String> {
  let root = resolve_recovery_root(app).await?;
  let entries = read_recovery_entries(&root).await?;
  let mut deleted_count = 0usize;
  let mut failed_count = 0usize;

  for entry in &entries {
    let draft_path = recovery_draft_path(&root.root_path, &entry.draft_file);
    match tokio::fs::remove_file(&draft_path).await {
      Ok(_) => {
        deleted_count += 1;
      }
      Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
      Err(_) => {
        failed_count += 1;
      }
    }
  }

  write_recovery_entries(&root, &[]).await?;
  Ok(RecoveryClearResult {
    root_path: root.root_path.to_string_lossy().to_string(),
    origin: root.origin,
    deleted_count,
    failed_count,
  })
}
