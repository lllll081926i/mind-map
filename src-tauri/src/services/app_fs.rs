use serde::Serialize;
use std::path::Path;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryEntry {
  pub id: String,
  pub name: String,
  pub r#type: String,
  pub mode: String,
  pub path: String,
  pub leaf: bool,
  pub enable_edit: bool,
}

pub async fn read_text_file(path: &str) -> Result<String, String> {
  tokio::fs::read_to_string(path)
    .await
    .map_err(|error| error.to_string())
}

pub async fn write_text_file(path: &str, content: &str) -> Result<(), String> {
  if let Some(parent) = Path::new(path).parent() {
    tokio::fs::create_dir_all(parent)
      .await
      .map_err(|error| error.to_string())?;
  }
  tokio::fs::write(path, content)
    .await
    .map_err(|error| error.to_string())
}

pub async fn list_directory_entries(path: &str) -> Result<Vec<DirectoryEntry>, String> {
  let mut entries = tokio::fs::read_dir(path)
    .await
    .map_err(|error| error.to_string())?;
  let mut dir_list = Vec::new();
  let mut file_list = Vec::new();

  while let Some(entry) = entries.next_entry().await.map_err(|error| error.to_string())? {
    let entry_path = entry.path();
    let metadata = entry.metadata().await.map_err(|error| error.to_string())?;
    let name = entry.file_name().to_string_lossy().to_string();
    let is_file = metadata.is_file();
    if is_file && !name.ends_with(".smm") && !name.ends_with(".xmind") && !name.ends_with(".md") && !name.ends_with(".json") {
      continue;
    }
    let data = DirectoryEntry {
      id: entry_path.to_string_lossy().to_string(),
      name: name.clone(),
      r#type: if is_file { "file".into() } else { "directory".into() },
      mode: "desktop".into(),
      path: entry_path.to_string_lossy().to_string(),
      leaf: is_file,
      enable_edit: is_file && (name.ends_with(".smm") || name.ends_with(".json")),
    };
    if is_file {
      file_list.push(data);
    } else {
      dir_list.push(data);
    }
  }

  dir_list.sort_by(|left, right| left.name.cmp(&right.name));
  file_list.sort_by(|left, right| left.name.cmp(&right.name));
  dir_list.extend(file_list);
  Ok(dir_list)
}
