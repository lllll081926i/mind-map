use crate::services::app_fs::{self, DirectoryEntry};

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
pub async fn read_text_file(path: String) -> Result<String, String> {
  validate_path_length(&path)?;
  app_fs::read_text_file(&path).await
}

#[tauri::command]
pub async fn write_text_file(path: String, content: String) -> Result<(), String> {
  validate_path_length(&path)?;
  app_fs::write_text_file(&path, &content).await
}

#[tauri::command]
pub async fn list_directory_entries(
  app: tauri::AppHandle,
  path: String,
) -> Result<Vec<DirectoryEntry>, String> {
  validate_path_length(&path)?;
  app_fs::list_directory_entries(&app, &path).await
}
