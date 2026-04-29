use crate::services::app_state::{
  self, DesktopDocumentState, DesktopMetaState, DesktopState, RecentFileItem,
};
use crate::services::file_association::PendingAssociatedFiles;
use reqwest::Url;
use std::process::Command;

#[tauri::command]
pub async fn read_bootstrap_state(app: tauri::AppHandle) -> Result<DesktopState, String> {
  app_state::read_state(&app).await
}

#[tauri::command]
pub async fn read_bootstrap_meta_state(
  app: tauri::AppHandle,
) -> Result<DesktopMetaState, String> {
  app_state::read_meta_state(&app).await
}

#[tauri::command]
pub async fn read_bootstrap_document_state(
  app: tauri::AppHandle,
) -> Result<DesktopDocumentState, String> {
  app_state::read_document_state(&app).await
}

#[tauri::command]
pub async fn write_bootstrap_state(
  app: tauri::AppHandle,
  state: DesktopState,
) -> Result<(), String> {
  app_state::write_state(&app, &state).await
}

#[tauri::command]
pub async fn write_bootstrap_meta_state(
  app: tauri::AppHandle,
  state: DesktopMetaState,
) -> Result<(), String> {
  app_state::write_meta_state(&app, &state).await
}

#[tauri::command]
pub async fn write_bootstrap_document_state(
  app: tauri::AppHandle,
  state: DesktopDocumentState,
) -> Result<(), String> {
  app_state::write_document_state(&app, &state).await
}

#[tauri::command]
pub async fn record_recent_file(
  app: tauri::AppHandle,
  item: RecentFileItem,
) -> Result<DesktopState, String> {
  let mut meta_state = app_state::read_meta_state_raw(&app).await?;
  meta_state.upsert_recent_file(item);
  let meta_snapshot = DesktopMetaState {
    version: meta_state.version,
    local_config: meta_state.local_config.clone(),
    ai_config: meta_state.ai_config.clone(),
    recent_files: meta_state.recent_files.clone(),
    last_directory: meta_state.last_directory.clone(),
    current_document: meta_state.current_document.clone(),
  };
  let next_state = DesktopState {
    version: meta_snapshot.version,
    mind_map_data: serde_json::Value::Null,
    mind_map_config: None,
    flowchart_data: serde_json::Value::Null,
    flowchart_config: None,
    local_config: meta_snapshot.local_config.clone(),
    ai_config: meta_snapshot.ai_config.clone(),
    recent_files: meta_snapshot.recent_files.clone(),
    last_directory: meta_snapshot.last_directory.clone(),
    current_document: meta_snapshot.current_document.clone(),
  };
  app_state::write_meta_state(&app, &meta_snapshot).await?;
  Ok(next_state)
}

#[tauri::command]
pub fn take_pending_associated_files(
  state: tauri::State<'_, PendingAssociatedFiles>,
) -> Vec<String> {
  state.take_paths()
}

#[tauri::command]
pub async fn open_external_url(url: String) -> Result<(), String> {
  let parsed_url = Url::parse(&url).map_err(|error| error.to_string())?;
  if !matches!(parsed_url.scheme(), "http" | "https") {
    return Err("仅支持打开 http/https 链接".to_string());
  }

  #[cfg(target_os = "windows")]
  {
    Command::new("rundll32")
      .args(["url.dll,FileProtocolHandler", parsed_url.as_str()])
      .spawn()
      .map_err(|error| error.to_string())?;
    return Ok(());
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open")
      .arg(parsed_url.as_str())
      .spawn()
      .map_err(|error| error.to_string())?;
    return Ok(());
  }

  #[cfg(target_os = "linux")]
  {
    Command::new("xdg-open")
      .arg(parsed_url.as_str())
      .spawn()
      .map_err(|error| error.to_string())?;
    return Ok(());
  }

  #[allow(unreachable_code)]
  Err("当前平台暂不支持打开外部链接".to_string())
}
