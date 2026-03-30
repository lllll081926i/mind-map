use crate::services::app_fs::{self, DirectoryEntry};

#[tauri::command]
pub async fn read_text_file(path: String) -> Result<String, String> {
  app_fs::read_text_file(&path).await
}

#[tauri::command]
pub async fn write_text_file(path: String, content: String) -> Result<(), String> {
  app_fs::write_text_file(&path, &content).await
}

#[tauri::command]
pub async fn list_directory_entries(path: String) -> Result<Vec<DirectoryEntry>, String> {
  app_fs::list_directory_entries(&path).await
}
