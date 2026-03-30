#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod services;

use services::ai::AiRequestRegistry;

fn main() {
  tauri::Builder::default()
    .manage(AiRequestRegistry::default())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      commands::config::read_bootstrap_state,
      commands::config::write_bootstrap_state,
      commands::config::record_recent_file,
      commands::fs::read_text_file,
      commands::fs::write_text_file,
      commands::fs::list_directory_entries,
      commands::ai::start_ai_proxy_request,
      commands::ai::stop_ai_proxy_request
    ])
    .run(tauri::generate_context!())
    .expect("failed to run tauri application");
}
