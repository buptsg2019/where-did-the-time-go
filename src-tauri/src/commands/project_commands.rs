use crate::models::project::{Project, CreateProjectRequest, UpdateProjectRequest};
use crate::services::database::Database;
use crate::utils::error::AppResult;
use std::sync::Mutex;
use tauri::State;

// Database state wrapper for Tauri
pub struct DbState(pub Mutex<Database>);

#[tauri::command]
pub fn get_projects(state: State<DbState>) -> AppResult<Vec<Project>> {
    let db = state.0.lock().map_err(|_| {
        crate::utils::error::AppError::OperationFailed("Failed to lock database".to_string())
    })?;
    db.get_projects()
}

#[tauri::command]
pub fn create_project(
    request: CreateProjectRequest,
    state: State<DbState>,
) -> AppResult<Project> {
    let db = state.0.lock().map_err(|_| {
        crate::utils::error::AppError::OperationFailed("Failed to lock database".to_string())
    })?;
    db.create_project(&request)
}

#[tauri::command]
pub fn update_project(
    request: UpdateProjectRequest,
    state: State<DbState>,
) -> AppResult<Project> {
    let db = state.0.lock().map_err(|_| {
        crate::utils::error::AppError::OperationFailed("Failed to lock database".to_string())
    })?;
    db.update_project(&request)
}

#[tauri::command]
pub fn archive_project(id: i64, state: State<DbState>) -> AppResult<()> {
    let db = state.0.lock().map_err(|_| {
        crate::utils::error::AppError::OperationFailed("Failed to lock database".to_string())
    })?;
    db.archive_project(id)
}

#[tauri::command]
pub fn delete_project(id: i64, state: State<DbState>) -> AppResult<()> {
    let db = state.0.lock().map_err(|_| {
        crate::utils::error::AppError::OperationFailed("Failed to lock database".to_string())
    })?;
    db.delete_project(id)
}
