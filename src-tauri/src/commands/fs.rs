use crate::services::{
  app_fs::{self, DirectoryEntry},
  file_association::PendingAssociatedFiles,
};

fn validate_path_length(path: &str) -> Result<(), String> {
  if path.trim().is_empty() {
    return Err("路径不能为空".into());
  }
  if path.len() > 4096 {
    return Err("路径过长".into());
  }
  Ok(())
}

#[tauri::command]
pub async fn read_text_file(app: tauri::AppHandle, path: String) -> Result<String, String> {
  validate_path_length(&path)?;
  app_fs::read_text_file(&app, &path).await
}

#[tauri::command]
pub async fn write_text_file(
  app: tauri::AppHandle,
  path: String,
  content: String,
) -> Result<(), String> {
  validate_path_length(&path)?;
  app_fs::write_text_file(&app, &path, &content).await
}

#[tauri::command]
pub async fn write_binary_file(
  app: tauri::AppHandle,
  path: String,
  content: Vec<u8>,
) -> Result<(), String> {
  validate_path_length(&path)?;
  app_fs::write_binary_file(&app, &path, &content).await
}

#[tauri::command]
pub async fn list_directory_entries(
  app: tauri::AppHandle,
  path: String,
) -> Result<Vec<DirectoryEntry>, String> {
  validate_path_length(&path)?;
  app_fs::list_directory_entries(&app, &path).await
}

#[tauri::command]
pub fn remember_user_selected_path(
  state: tauri::State<'_, PendingAssociatedFiles>,
  path: String,
) -> Result<(), String> {
  validate_path_length(&path)?;
  state.push_paths(vec![path]);
  Ok(())
}
