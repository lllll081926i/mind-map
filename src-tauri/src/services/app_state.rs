use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

const META_STATE_FILE_NAME: &str = "app_state_meta.json";
const DOCUMENT_STATE_FILE_NAME: &str = "app_state_document.json";
const LEGACY_STATE_FILE_NAME: &str = "app_state.json";
const MAX_RECENT_FILES: usize = 20;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct RecentFileItem {
  pub path: String,
  pub name: String,
  #[serde(default)]
  pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DesktopMetaState {
  pub version: u32,
  pub local_config: serde_json::Value,
  pub ai_config: serde_json::Value,
  pub recent_files: Vec<RecentFileItem>,
  pub last_directory: String,
  pub current_document: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DesktopDocumentState {
  pub version: u32,
  pub mind_map_data: serde_json::Value,
  pub mind_map_config: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DesktopState {
  pub version: u32,
  pub mind_map_data: serde_json::Value,
  pub mind_map_config: Option<serde_json::Value>,
  pub local_config: serde_json::Value,
  pub ai_config: serde_json::Value,
  pub recent_files: Vec<RecentFileItem>,
  pub last_directory: String,
  pub current_document: Option<serde_json::Value>,
}

impl DesktopMetaState {
  pub fn upsert_recent_file(&mut self, item: RecentFileItem) {
    if item.path.trim().is_empty() {
      return;
    }
    let normalized_item = RecentFileItem {
      updated_at: if item.updated_at > 0 {
        item.updated_at
      } else {
        current_timestamp_millis()
      },
      ..item
    };
    self
      .recent_files
      .retain(|current| current.path.trim() != normalized_item.path.trim());
    self.recent_files.insert(0, normalized_item);
    self
      .recent_files
      .sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
    self.recent_files.truncate(MAX_RECENT_FILES);
  }
}

fn current_timestamp_millis() -> u64 {
  std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .map(|duration| duration.as_millis() as u64)
    .unwrap_or(0)
}

fn default_meta_state() -> DesktopMetaState {
  DesktopMetaState {
    version: 1,
    local_config: serde_json::Value::Null,
    ai_config: serde_json::Value::Null,
    recent_files: vec![],
    last_directory: String::new(),
    current_document: None,
  }
}

fn default_document_state() -> DesktopDocumentState {
  DesktopDocumentState {
    version: 1,
    mind_map_data: serde_json::Value::Null,
    mind_map_config: None,
  }
}

fn merge_state(meta: DesktopMetaState, document: DesktopDocumentState) -> DesktopState {
  DesktopState {
    version: meta.version.max(document.version).max(1),
    mind_map_data: document.mind_map_data,
    mind_map_config: document.mind_map_config,
    local_config: meta.local_config,
    ai_config: meta.ai_config,
    recent_files: meta.recent_files,
    last_directory: meta.last_directory,
    current_document: meta.current_document,
  }
}

fn split_state(state: &DesktopState) -> (DesktopMetaState, DesktopDocumentState) {
  (
    DesktopMetaState {
      version: state.version,
      local_config: state.local_config.clone(),
      ai_config: state.ai_config.clone(),
      recent_files: state.recent_files.clone(),
      last_directory: state.last_directory.clone(),
      current_document: state.current_document.clone(),
    },
    DesktopDocumentState {
      version: state.version,
      mind_map_data: state.mind_map_data.clone(),
      mind_map_config: state.mind_map_config.clone(),
    },
  )
}

fn state_dir_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let path = app
    .path()
    .app_data_dir()
    .map_err(|error| error.to_string())?;
  tokio::task::block_in_place(|| {
    std::fs::create_dir_all(&path)
  }).map_err(|error| error.to_string())?;
  Ok(path)
}

fn meta_state_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let mut path = state_dir_path(app)?;
  path.push(META_STATE_FILE_NAME);
  Ok(path)
}

fn document_state_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let mut path = state_dir_path(app)?;
  path.push(DOCUMENT_STATE_FILE_NAME);
  Ok(path)
}

fn legacy_state_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let mut path = state_dir_path(app)?;
  path.push(LEGACY_STATE_FILE_NAME);
  Ok(path)
}

async fn read_json_file<T>(path: PathBuf, default_value: T) -> Result<T, String>
where
  T: DeserializeOwned,
{
  if !path.exists() {
    return Ok(default_value);
  }
  let content = tokio::fs::read(path)
    .await
    .map_err(|error| error.to_string())?;
  if content.is_empty() {
    return Ok(default_value);
  }
  serde_json::from_slice(&content).map_err(|error| error.to_string())
}

async fn write_json_file<T>(path: PathBuf, value: &T) -> Result<(), String>
where
  T: Serialize,
{
  let content = serde_json::to_vec(value).map_err(|error| error.to_string())?;
  tokio::fs::write(path, content)
    .await
    .map_err(|error| error.to_string())
}

async fn read_legacy_state(app: &tauri::AppHandle) -> Result<Option<DesktopState>, String> {
  let path = legacy_state_file_path(app)?;
  if !path.exists() {
    return Ok(None);
  }
  let content = tokio::fs::read(path)
    .await
    .map_err(|error| error.to_string())?;
  if content.is_empty() {
    return Ok(None);
  }
  let state = serde_json::from_slice(&content).map_err(|error| error.to_string())?;
  Ok(Some(state))
}

async fn migrate_legacy_state(app: &tauri::AppHandle) -> Result<Option<DesktopState>, String> {
  let meta_path = meta_state_file_path(app)?;
  let document_path = document_state_file_path(app)?;
  if meta_path.exists() && document_path.exists() {
    return Ok(None);
  }
  let Some(legacy_state) = read_legacy_state(app).await? else {
    return Ok(None);
  };
  let (meta_state, document_state) = split_state(&legacy_state);
  if !meta_path.exists() {
    write_json_file(meta_path, &meta_state).await?;
  }
  if !document_path.exists() {
    write_json_file(document_path, &document_state).await?;
  }
  Ok(Some(legacy_state))
}

pub async fn read_meta_state_raw(app: &tauri::AppHandle) -> Result<DesktopMetaState, String> {
  let path = meta_state_file_path(app)?;
  if path.exists() {
    return read_json_file(path, default_meta_state()).await;
  }
  if let Some(legacy_state) = migrate_legacy_state(app).await? {
    let (meta_state, _) = split_state(&legacy_state);
    return Ok(meta_state);
  }
  Ok(default_meta_state())
}

pub async fn read_document_state_raw(
  app: &tauri::AppHandle,
) -> Result<DesktopDocumentState, String> {
  let path = document_state_file_path(app)?;
  if path.exists() {
    return read_json_file(path, default_document_state()).await;
  }
  if let Some(legacy_state) = migrate_legacy_state(app).await? {
    let (_, document_state) = split_state(&legacy_state);
    return Ok(document_state);
  }
  Ok(default_document_state())
}

pub async fn read_state(app: &tauri::AppHandle) -> Result<DesktopState, String> {
  let meta_state = read_meta_state_raw(app).await?;
  let document_state = read_document_state_raw(app).await?;
  Ok(merge_state(meta_state, document_state))
}

pub async fn read_meta_state(app: &tauri::AppHandle) -> Result<DesktopState, String> {
  let meta_state = read_meta_state_raw(app).await?;
  Ok(merge_state(meta_state, default_document_state()))
}

pub async fn read_document_state(app: &tauri::AppHandle) -> Result<DesktopState, String> {
  let document_state = read_document_state_raw(app).await?;
  Ok(merge_state(default_meta_state(), document_state))
}

pub async fn write_meta_state(app: &tauri::AppHandle, state: &DesktopState) -> Result<(), String> {
  let (meta_state, _) = split_state(state);
  write_json_file(meta_state_file_path(app)?, &meta_state).await
}

pub async fn write_document_state(
  app: &tauri::AppHandle,
  state: &DesktopState,
) -> Result<(), String> {
  let (_, document_state) = split_state(state);
  write_json_file(document_state_file_path(app)?, &document_state).await
}

pub async fn write_state(app: &tauri::AppHandle, state: &DesktopState) -> Result<(), String> {
  let (meta_state, document_state) = split_state(state);
  write_json_file(meta_state_file_path(app)?, &meta_state).await?;
  write_json_file(document_state_file_path(app)?, &document_state).await
}
