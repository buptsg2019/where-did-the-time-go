use crate::commands::project_commands::DbState;
use crate::models::time_record::TimeRecord;
use crate::utils::error::AppResult;
use tauri::State;

#[tauri::command]
pub fn start_timer(project_id: i64, state: State<DbState>) -> AppResult<i64> {
    let db = state.0.lock().map_err(|_| {
        crate::utils::error::AppError::OperationFailed("Failed to lock database".to_string())
    })?;
    db.start_timer(project_id)
}

#[tauri::command]
pub fn stop_timer(state: State<DbState>) -> AppResult<TimeRecord> {
    let db = state.0.lock().map_err(|_| {
        crate::utils::error::AppError::OperationFailed("Failed to lock database".to_string())
    })?;
    db.stop_timer()
}

#[tauri::command]
pub fn get_current_timer(state: State<DbState>) -> AppResult<Option<TimeRecord>> {
    let db = state.0.lock().map_err(|_| {
        crate::utils::error::AppError::OperationFailed("Failed to lock database".to_string())
    })?;
    db.get_active_timer()
}

#[tauri::command]
pub fn get_today_total_time(state: State<DbState>) -> AppResult<i64> {
    let db = state.0.lock().map_err(|_| {
        crate::utils::error::AppError::OperationFailed("Failed to lock database".to_string())
    })?;
    
    let conn = db.get_connection();
    let total: i64 = conn.query_row(
        "SELECT COALESCE(SUM(duration), 0) FROM time_records 
         WHERE date(start_time) = date('now') AND end_time IS NOT NULL",
        [],
        |row| row.get(0),
    ).unwrap_or(0);
    
    Ok(total)
}
