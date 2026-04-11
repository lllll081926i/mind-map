#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod services;

use services::{
  ai::AiRequestRegistry,
  file_association::{queue_and_emit_associated_files, resolve_associated_paths, PendingAssociatedFiles},
};

fn main() {
  let pending_associated_files = PendingAssociatedFiles::from_launch_args();

  let result = tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
      let cwd_path = if cwd.trim().is_empty() {
        None
      } else {
        Some(std::path::PathBuf::from(cwd))
      };
      let paths = resolve_associated_paths(args, cwd_path.as_deref());
      queue_and_emit_associated_files(app, paths);
    }))
    .manage(AiRequestRegistry::default())
    .manage(pending_associated_files)
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![
      commands::config::read_bootstrap_state,
      commands::config::read_bootstrap_meta_state,
      commands::config::read_bootstrap_document_state,
      commands::config::write_bootstrap_state,
      commands::config::write_bootstrap_meta_state,
      commands::config::write_bootstrap_document_state,
      commands::config::record_recent_file,
      commands::config::take_pending_associated_files,
      commands::config::open_external_url,
      commands::recovery::read_recovery_state,
      commands::recovery::read_recovery_draft,
      commands::recovery::write_recovery_draft,
      commands::recovery::clear_recovery_draft,
      commands::recovery::clear_all_recovery_drafts,
      commands::fs::remember_user_selected_path,
      commands::fs::read_text_file,
      commands::fs::write_text_file,
      commands::fs::list_directory_entries,
      commands::ai::start_ai_proxy_request,
      commands::ai::stop_ai_proxy_request
    ])
    .run(tauri::generate_context!());

  if let Err(error) = result {
    eprintln!("Tauri application error: {}", error);
    std::process::exit(1);
  }
}
