use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

const STATE_FILE_NAME: &str = "app_state.json";
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

impl DesktopState {
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

fn default_state() -> DesktopState {
  DesktopState {
    version: 1,
    mind_map_data: serde_json::Value::Null,
    mind_map_config: None,
    local_config: serde_json::Value::Null,
    ai_config: serde_json::Value::Null,
    recent_files: vec![],
    last_directory: String::new(),
    current_document: None,
  }
}

fn state_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let mut path = app
    .path()
    .app_data_dir()
    .map_err(|error| error.to_string())?;
  std::fs::create_dir_all(&path).map_err(|error| error.to_string())?;
  path.push(STATE_FILE_NAME);
  Ok(path)
}

pub async fn read_state(app: &tauri::AppHandle) -> Result<DesktopState, String> {
  let path = state_file_path(app)?;
  if !path.exists() {
    return Ok(default_state());
  }
  let content = tokio::fs::read_to_string(path)
    .await
    .map_err(|error| error.to_string())?;
  serde_json::from_str(&content).map_err(|error| error.to_string())
}

pub async fn write_state(app: &tauri::AppHandle, state: &DesktopState) -> Result<(), String> {
  let path = state_file_path(app)?;
  let content = serde_json::to_string_pretty(state).map_err(|error| error.to_string())?;
  tokio::fs::write(path, content)
    .await
    .map_err(|error| error.to_string())
}
