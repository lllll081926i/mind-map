use crate::services::ai::{self, AiProxyRequest, AiRequestRegistry};

#[tauri::command]
pub async fn start_ai_proxy_request(
  app: tauri::AppHandle,
  state: tauri::State<'_, AiRequestRegistry>,
  request_id: String,
  request: AiProxyRequest,
) -> Result<(), String> {
  ai::start_proxy_request(app, state.inner(), request_id, request).await
}

#[tauri::command]
pub async fn stop_ai_proxy_request(
  state: tauri::State<'_, AiRequestRegistry>,
  request_id: String,
) -> Result<(), String> {
  ai::stop_proxy_request(state.inner(), &request_id).await
}
