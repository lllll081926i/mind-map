use crate::services::app_state::{self, DesktopState, RecentFileItem};
use std::process::Command;

#[tauri::command]
pub async fn read_bootstrap_state(app: tauri::AppHandle) -> Result<DesktopState, String> {
  app_state::read_state(&app).await
}

#[tauri::command]
pub async fn write_bootstrap_state(
  app: tauri::AppHandle,
  state: DesktopState,
) -> Result<(), String> {
  app_state::write_state(&app, &state).await
}

#[tauri::command]
pub async fn record_recent_file(
  app: tauri::AppHandle,
  item: RecentFileItem,
) -> Result<DesktopState, String> {
  let mut state = app_state::read_state(&app).await?;
  state.upsert_recent_file(item);
  app_state::write_state(&app, &state).await?;
  Ok(state)
}

#[tauri::command]
pub async fn open_external_url(url: String) -> Result<(), String> {
  if !(url.starts_with("http://") || url.starts_with("https://")) {
    return Err("仅支持打开 http/https 链接".to_string());
  }

  #[cfg(target_os = "windows")]
  {
    Command::new("cmd")
      .args(["/C", "start", "", &url])
      .spawn()
      .map_err(|error| error.to_string())?;
    return Ok(());
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open")
      .arg(&url)
      .spawn()
      .map_err(|error| error.to_string())?;
    return Ok(());
  }

  #[cfg(target_os = "linux")]
  {
    Command::new("xdg-open")
      .arg(&url)
      .spawn()
      .map_err(|error| error.to_string())?;
    return Ok(());
  }

  #[allow(unreachable_code)]
  Err("当前平台暂不支持打开外部链接".to_string())
}
