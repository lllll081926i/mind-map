use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

const META_STATE_FILE_NAME: &str = "app_state_meta.json";
const DOCUMENT_STATE_FILE_NAME: &str = "app_state_document.json";
const LEGACY_STATE_FILE_NAME: &str = "app_state.json";
const MAX_RECENT_FILES: usize = 20;
const AI_KEY_CONFIG_FIELD: &str = "key";
const AI_KEYRING_USERNAME: &str = "default";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
#[serde(default)]
pub struct RecentFileItem {
  pub path: String,
  pub name: String,
  #[serde(default)]
  pub updated_at: u64,
  #[serde(default)]
  pub document_mode: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
#[serde(default)]
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
#[serde(default)]
pub struct DesktopDocumentState {
  pub version: u32,
  pub mind_map_data: serde_json::Value,
  pub mind_map_config: Option<serde_json::Value>,
  pub flowchart_data: serde_json::Value,
  pub flowchart_config: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
#[serde(default)]
pub struct DesktopState {
  pub version: u32,
  pub mind_map_data: serde_json::Value,
  pub mind_map_config: Option<serde_json::Value>,
  pub flowchart_data: serde_json::Value,
  pub flowchart_config: Option<serde_json::Value>,
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
    flowchart_data: serde_json::Value::Null,
    flowchart_config: None,
  }
}

fn merge_state(meta: DesktopMetaState, document: DesktopDocumentState) -> DesktopState {
  DesktopState {
    version: meta.version.max(document.version).max(1),
    mind_map_data: document.mind_map_data,
    mind_map_config: document.mind_map_config,
    flowchart_data: document.flowchart_data,
    flowchart_config: document.flowchart_config,
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
      flowchart_data: state.flowchart_data.clone(),
      flowchart_config: state.flowchart_config.clone(),
    },
  )
}

fn ai_keyring_service(app: &tauri::AppHandle) -> String {
  format!("{}.ai-config", app.config().identifier)
}

fn create_ai_key_entry(app: &tauri::AppHandle) -> Result<keyring::Entry, String> {
  keyring::Entry::new(&ai_keyring_service(app), AI_KEYRING_USERNAME)
    .map_err(|error| format!("初始化 AI 密钥存储失败: {}", error))
}

fn extract_ai_key_from_config(ai_config: &serde_json::Value) -> Option<String> {
  ai_config
    .as_object()
    .and_then(|object| object.get(AI_KEY_CONFIG_FIELD))
    .and_then(|value| value.as_str())
    .map(str::trim)
    .filter(|value| !value.is_empty())
    .map(str::to_string)
}

fn strip_ai_key_from_config(ai_config: &serde_json::Value) -> serde_json::Value {
  let Some(object) = ai_config.as_object() else {
    return ai_config.clone();
  };
  let mut sanitized = object.clone();
  sanitized.remove(AI_KEY_CONFIG_FIELD);
  serde_json::Value::Object(sanitized)
}

fn inject_ai_key_into_config(
  ai_config: &serde_json::Value,
  secret: Option<String>,
) -> serde_json::Value {
  let Some(object) = ai_config.as_object() else {
    return ai_config.clone();
  };
  let mut hydrated = object.clone();
  if let Some(secret) = secret.filter(|value| !value.trim().is_empty()) {
    hydrated.insert(
      AI_KEY_CONFIG_FIELD.to_string(),
      serde_json::Value::String(secret),
    );
  }
  serde_json::Value::Object(hydrated)
}

fn read_ai_key_from_secure_store(app: &tauri::AppHandle) -> Option<String> {
  let entry = match create_ai_key_entry(app) {
    Ok(entry) => entry,
    Err(error) => {
      eprintln!("[MindMap] 警告: {}", error);
      return None;
    }
  };
  match entry.get_password() {
    Ok(password) => Some(password),
    Err(keyring::Error::NoEntry) => None,
    Err(error) => {
      eprintln!("[MindMap] 警告: 读取 AI 密钥失败，将继续使用无密钥状态: {}", error);
      None
    }
  }
}

fn write_ai_key_to_secure_store(
  app: &tauri::AppHandle,
  secret: Option<&str>,
) -> Result<(), String> {
  let entry = create_ai_key_entry(app)?;
  if let Some(secret) = secret.map(str::trim).filter(|value| !value.is_empty()) {
    return entry
      .set_password(secret)
      .map_err(|error| format!("写入 AI 密钥失败: {}", error));
  }
  match entry.delete_credential() {
    Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
    Err(error) => Err(format!("删除 AI 密钥失败: {}", error)),
  }
}

fn hydrate_meta_state_with_secret(
  app: &tauri::AppHandle,
  mut state: DesktopMetaState,
) -> DesktopMetaState {
  state.ai_config = inject_ai_key_into_config(
    &state.ai_config,
    read_ai_key_from_secure_store(app),
  );
  state
}

fn sanitize_meta_state_for_write(
  app: &tauri::AppHandle,
  state: &DesktopMetaState,
) -> Result<DesktopMetaState, String> {
  let secret = extract_ai_key_from_config(&state.ai_config);
  write_ai_key_to_secure_store(app, secret.as_deref())?;
  let mut sanitized = state.clone();
  sanitized.ai_config = strip_ai_key_from_config(&state.ai_config);
  Ok(sanitized)
}

async fn state_dir_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let path = app
    .path()
    .app_data_dir()
    .map_err(|error| format!("获取应用数据目录失败: {}", error))?;

  if !tokio::fs::try_exists(&path)
    .await
    .map_err(|error| format!("检查应用数据目录失败 ({}): {}", path.display(), error))?
  {
    tokio::fs::create_dir_all(&path)
      .await
      .map_err(|error| format!("创建应用数据目录失败 ({}): {}", path.display(), error))?;
  }

  let metadata = tokio::fs::metadata(&path)
    .await
    .map_err(|error| format!("读取应用数据目录信息失败 ({}): {}", path.display(), error))?;
  if !metadata.is_dir() {
    return Err(format!("应用数据目录不可用 ({}): 目标不是目录", path.display()));
  }

  eprintln!("[MindMap] 应用数据目录: {}", path.display());
  Ok(path)
}

async fn meta_state_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let mut path = state_dir_path(app).await?;
  path.push(META_STATE_FILE_NAME);
  Ok(path)
}

async fn document_state_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let mut path = state_dir_path(app).await?;
  path.push(DOCUMENT_STATE_FILE_NAME);
  Ok(path)
}

async fn legacy_state_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let mut path = state_dir_path(app).await?;
  path.push(LEGACY_STATE_FILE_NAME);
  Ok(path)
}

async fn read_json_file<T>(path: PathBuf, default_value: T) -> Result<T, String>
where
  T: DeserializeOwned + Clone,
{
  if !path.exists() {
    return Ok(default_value.clone());
  }
  let content = match tokio::fs::read(&path).await {
    Ok(content) => content,
    Err(error) => {
      eprintln!(
        "[MindMap] 警告: 读取状态文件失败 {}: {}, 使用默认值",
        path.display(),
        error
      );
      return Ok(default_value.clone());
    }
  };
  let content = if content.starts_with(&[0xEF, 0xBB, 0xBF]) {
    &content[3..]
  } else {
    &content[..]
  };
  if content.is_empty() || content.iter().all(|byte| byte.is_ascii_whitespace()) {
    eprintln!(
      "[MindMap] 警告: 状态文件为空 {}，使用默认值",
      path.display()
    );
    return Ok(default_value.clone());
  }
  match serde_json::from_slice(content) {
    Ok(value) => Ok(value),
    Err(error) => {
      eprintln!(
        "[MindMap] 警告: 状态文件损坏 {}: {}, 使用默认值",
        path.display(),
        error
      );
      let backup_path = path.with_extension("json.corrupted");
      let _ = tokio::fs::remove_file(&backup_path).await;
      let _ = tokio::fs::rename(&path, &backup_path).await;
      Ok(default_value)
    }
  }
}

async fn write_json_file<T>(path: PathBuf, value: &T) -> Result<(), String>
where
  T: Serialize,
{
  let content = serde_json::to_vec_pretty(value).map_err(|error| error.to_string())?;
  let temp_path = path.with_extension("json.tmp");
  let backup_path = path.with_extension("json.bak");
  tokio::fs::write(&temp_path, content)
    .await
    .map_err(|error| format!("写入临时状态文件失败: {}", error))?;

  let mut original_backed_up = false;
  if tokio::fs::try_exists(&path)
    .await
    .map_err(|error| format!("检查状态文件失败 ({}): {}", path.display(), error))?
  {
    let _ = tokio::fs::remove_file(&backup_path).await;
    tokio::fs::rename(&path, &backup_path)
      .await
      .map_err(|error| format!("备份旧状态文件失败: {}", error))?;
    original_backed_up = true;
  }

  if let Err(error) = tokio::fs::rename(&temp_path, &path).await {
    let _ = tokio::fs::remove_file(&temp_path).await;
    if original_backed_up {
      let _ = tokio::fs::rename(&backup_path, &path).await;
    }
    return Err(format!("重命名状态文件失败: {}", error));
  }

  if original_backed_up {
    let _ = tokio::fs::remove_file(&backup_path).await;
  }

  Ok(())
}

async fn read_legacy_state(app: &tauri::AppHandle) -> Result<Option<DesktopState>, String> {
  let path = legacy_state_file_path(app).await?;
  if !tokio::fs::try_exists(&path)
    .await
    .map_err(|error| format!("检查旧状态文件失败 ({}): {}", path.display(), error))?
  {
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
  let meta_path = meta_state_file_path(app).await?;
  let document_path = document_state_file_path(app).await?;
  let meta_exists = tokio::fs::try_exists(&meta_path)
    .await
    .map_err(|error| format!("检查元状态文件失败 ({}): {}", meta_path.display(), error))?;
  let document_exists = tokio::fs::try_exists(&document_path).await.map_err(|error| {
    format!(
      "检查文档状态文件失败 ({}): {}",
      document_path.display(),
      error
    )
  })?;
  if meta_exists && document_exists {
    return Ok(None);
  }
  let Some(legacy_state) = read_legacy_state(app).await? else {
    return Ok(None);
  };
  let (meta_state, document_state) = split_state(&legacy_state);
  if !meta_exists {
    write_json_file(meta_path, &meta_state).await?;
  }
  if !document_exists {
    write_json_file(document_path, &document_state).await?;
  }
  Ok(Some(legacy_state))
}

pub async fn read_meta_state_raw(app: &tauri::AppHandle) -> Result<DesktopMetaState, String> {
  let path = meta_state_file_path(app).await?;
  if tokio::fs::try_exists(&path)
    .await
    .map_err(|error| format!("检查元状态文件失败 ({}): {}", path.display(), error))?
  {
    let state = read_json_file(path, default_meta_state()).await?;
    return Ok(hydrate_meta_state_with_secret(app, state));
  }
  if let Some(legacy_state) = migrate_legacy_state(app).await? {
    let (meta_state, _) = split_state(&legacy_state);
    return Ok(hydrate_meta_state_with_secret(app, meta_state));
  }
  Ok(hydrate_meta_state_with_secret(app, default_meta_state()))
}

pub async fn read_document_state_raw(
  app: &tauri::AppHandle,
) -> Result<DesktopDocumentState, String> {
  let path = document_state_file_path(app).await?;
  if tokio::fs::try_exists(&path)
    .await
    .map_err(|error| format!("检查文档状态文件失败 ({}): {}", path.display(), error))?
  {
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

pub async fn read_meta_state(app: &tauri::AppHandle) -> Result<DesktopMetaState, String> {
  read_meta_state_raw(app).await
}

pub async fn read_document_state(
  app: &tauri::AppHandle,
) -> Result<DesktopDocumentState, String> {
  read_document_state_raw(app).await
}

pub async fn write_meta_state(
  app: &tauri::AppHandle,
  state: &DesktopMetaState,
) -> Result<(), String> {
  let sanitized = sanitize_meta_state_for_write(app, state)?;
  write_json_file(meta_state_file_path(app).await?, &sanitized).await
}

pub async fn write_document_state(
  app: &tauri::AppHandle,
  state: &DesktopDocumentState,
) -> Result<(), String> {
  write_json_file(document_state_file_path(app).await?, state).await
}

pub async fn write_state(app: &tauri::AppHandle, state: &DesktopState) -> Result<(), String> {
  let (meta_state, document_state) = split_state(state);
  let sanitized_meta_state = sanitize_meta_state_for_write(app, &meta_state)?;
  write_json_file(meta_state_file_path(app).await?, &sanitized_meta_state).await?;
  write_json_file(document_state_file_path(app).await?, &document_state).await
}

#[cfg(test)]
mod tests {
  use super::{
    extract_ai_key_from_config, inject_ai_key_into_config, strip_ai_key_from_config,
  };

  #[test]
  fn strip_ai_key_from_config_removes_plaintext_secret() {
    let ai_config = serde_json::json!({
      "provider": "openai",
      "baseUrl": "https://api.openai.com",
      "key": "demo-secret"
    });

    let sanitized = strip_ai_key_from_config(&ai_config);

    assert_eq!(extract_ai_key_from_config(&sanitized), None);
    assert_eq!(sanitized["provider"], "openai");
  }

  #[test]
  fn inject_ai_key_into_config_restores_secret_for_runtime() {
    let ai_config = serde_json::json!({
      "provider": "openai",
      "baseUrl": "https://api.openai.com"
    });

    let hydrated = inject_ai_key_into_config(&ai_config, Some("runtime-secret".into()));

    assert_eq!(
      extract_ai_key_from_config(&hydrated).as_deref(),
      Some("runtime-secret")
    );
    assert_eq!(hydrated["provider"], "openai");
  }
}
