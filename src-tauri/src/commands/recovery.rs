use crate::services::recovery::{self, RecoveryClearResult, RecoveryDraft, RecoveryDraftInput, RecoveryState};

fn validate_source_path(path: &str) -> Result<(), String> {
  if path.trim().is_empty() {
    return Err("恢复来源路径不能为空".into());
  }
  if path.len() > 4096 {
    return Err("恢复来源路径过长".into());
  }
  Ok(())
}

#[tauri::command]
pub async fn read_recovery_state(app: tauri::AppHandle) -> Result<RecoveryState, String> {
  recovery::read_recovery_state(&app).await
}

#[tauri::command]
pub async fn read_recovery_draft(
  app: tauri::AppHandle,
  source_path: String,
) -> Result<Option<RecoveryDraft>, String> {
  validate_source_path(&source_path)?;
  recovery::read_recovery_draft(&app, &source_path).await
}

#[tauri::command]
pub async fn write_recovery_draft(
  app: tauri::AppHandle,
  draft: RecoveryDraftInput,
) -> Result<RecoveryDraft, String> {
  validate_source_path(&draft.source_path)?;
  recovery::write_recovery_draft(&app, draft).await
}

#[tauri::command]
pub async fn clear_recovery_draft(
  app: tauri::AppHandle,
  source_path: String,
) -> Result<RecoveryClearResult, String> {
  validate_source_path(&source_path)?;
  recovery::clear_recovery_draft(&app, &source_path).await
}

#[tauri::command]
pub async fn clear_all_recovery_drafts(
  app: tauri::AppHandle,
) -> Result<RecoveryClearResult, String> {
  recovery::clear_all_recovery_drafts(&app).await
}
