use crate::services::app_state::{self, DesktopState, RecentFileItem};

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
