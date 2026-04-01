use serde::Serialize;
use std::path::Path;

const ALLOWED_EXTENSIONS: &[&str] = &[".smm", ".xmind", ".md", ".json"];

fn is_path_safe(path: &str) -> bool {
  let path_lower = path.to_lowercase();
  let dangerous_patterns = [
    "..\\", "../", "\\\\?\\", "con", "prn", "aux", "nul",
    "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8", "com9",
    "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9",
  ];
  if dangerous_patterns.iter().any(|p| path_lower.contains(p)) {
    return false;
  }
  true
}

fn has_allowed_extension(path: &str) -> bool {
  ALLOWED_EXTENSIONS.iter().any(|ext| path.ends_with(ext))
}

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
  if !has_allowed_extension(path) {
    return Err("不支持的文件类型".into());
  }
  if !is_path_safe(path) {
    return Err("无效的路径".into());
  }
  tokio::fs::read_to_string(path)
    .await
    .map_err(|error| error.to_string())
}

pub async fn write_text_file(path: &str, content: &str) -> Result<(), String> {
  if !has_allowed_extension(path) {
    return Err("不支持的文件类型".into());
  }
  if !is_path_safe(path) {
    return Err("无效的路径".into());
  }
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
