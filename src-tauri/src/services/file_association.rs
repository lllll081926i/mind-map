use serde::Serialize;
use std::{
  ffi::OsString,
  path::{Path, PathBuf},
  sync::Mutex,
};
use tauri::{AppHandle, Emitter, Manager};

pub const OPEN_ASSOCIATED_FILES_EVENT: &str = "desktop://open-associated-files";

#[derive(Default)]
pub struct PendingAssociatedFiles {
  paths: Mutex<Vec<String>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssociatedFilesPayload {
  pub paths: Vec<String>,
}

impl PendingAssociatedFiles {
  fn lock_paths(&self) -> std::sync::MutexGuard<'_, Vec<String>> {
    match self.paths.lock() {
      Ok(guard) => guard,
      Err(poisoned) => poisoned.into_inner(),
    }
  }

  pub fn from_launch_args() -> Self {
    let state = Self::default();
    let cwd = std::env::current_dir().ok();
    let launch_paths = resolve_associated_paths(std::env::args_os(), cwd.as_deref());
    state.push_paths(launch_paths);
    state
  }

  pub fn push_paths(&self, incoming_paths: Vec<String>) {
    if incoming_paths.is_empty() {
      return;
    }
    let mut guard = self.lock_paths();
    for path in incoming_paths {
      if guard.iter().any(|current| current == &path) {
        continue;
      }
      guard.push(path);
    }
  }

  pub fn take_paths(&self) -> Vec<String> {
    let mut guard = self.lock_paths();
    std::mem::take(&mut *guard)
  }
}

pub fn queue_and_emit_associated_files(app: &AppHandle, paths: Vec<String>) {
  if paths.is_empty() {
    return;
  }

  let state = app.state::<PendingAssociatedFiles>();
  state.push_paths(paths.clone());

  let payload = AssociatedFilesPayload { paths };
  let _ = app.emit(OPEN_ASSOCIATED_FILES_EVENT, payload);

  if let Some(window) = app.get_webview_window("main") {
    let _ = window.show();
    let _ = window.set_focus();
  }
}

pub fn resolve_associated_paths<I, S>(args: I, cwd: Option<&Path>) -> Vec<String>
where
  I: IntoIterator<Item = S>,
  S: Into<OsString>,
{
  args
    .into_iter()
    .enumerate()
    .filter_map(|(index, item)| normalize_associated_path(item.into(), cwd, index == 0))
    .collect()
}

fn normalize_associated_path(
  value: OsString,
  cwd: Option<&Path>,
  is_first_arg: bool,
) -> Option<String> {
  if is_first_arg {
    return None;
  }

  if value.is_empty() {
    return None;
  }

  let raw_path = PathBuf::from(value);
  if raw_path.as_os_str().is_empty() {
    return None;
  }

  let resolved_path = if raw_path.is_relative() {
    cwd.map(|base| base.join(&raw_path)).unwrap_or(raw_path)
  } else {
    raw_path
  };

  if !resolved_path.is_file() || !is_smm_file(&resolved_path) {
    return None;
  }

  let normalized_path = std::fs::canonicalize(&resolved_path).unwrap_or(resolved_path);
  Some(normalized_path.to_string_lossy().to_string())
}

fn is_smm_file(path: &Path) -> bool {
  path
    .extension()
    .and_then(|extension| extension.to_str())
    .map(|extension| extension.eq_ignore_ascii_case("smm"))
    .unwrap_or(false)
}

#[cfg(test)]
mod tests {
  use super::resolve_associated_paths;
  use std::{
    ffi::OsString,
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
  };

  fn create_temp_dir() -> PathBuf {
    let unique = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .expect("time went backwards")
      .as_nanos();
    let path = std::env::temp_dir().join(format!("mind-map-file-association-{unique}"));
    fs::create_dir_all(&path).expect("create temp dir");
    path
  }

  fn create_file(path: &Path) {
    fs::write(path, b"{}").expect("write test file");
  }

  #[test]
  fn resolve_associated_paths_filters_non_smm_arguments() {
    let temp_dir = create_temp_dir();
    let target_file = temp_dir.join("demo.smm");
    let other_file = temp_dir.join("demo.txt");
    create_file(&target_file);
    create_file(&other_file);

    let paths = resolve_associated_paths(
      vec![
        OsString::from("MindMap.exe"),
        OsString::from("--flag"),
        target_file.clone().into_os_string(),
        other_file.into_os_string(),
      ],
      Some(&temp_dir),
    );

    assert_eq!(paths.len(), 1);
    assert!(paths[0].ends_with("demo.smm"));

    let _ = fs::remove_dir_all(&temp_dir);
  }

  #[test]
  fn resolve_associated_paths_supports_relative_paths() {
    let temp_dir = create_temp_dir();
    let target_file = temp_dir.join("relative.smm");
    create_file(&target_file);

    let paths = resolve_associated_paths(
      vec![OsString::from("MindMap.exe"), OsString::from("relative.smm")],
      Some(&temp_dir),
    );

    assert_eq!(paths.len(), 1);
    assert!(paths[0].ends_with("relative.smm"));

    let _ = fs::remove_dir_all(&temp_dir);
  }
}
