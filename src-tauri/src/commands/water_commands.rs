use crate::commands::project_commands::DbState;
use crate::utils::error::AppResult;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Serialize, Deserialize)]
pub struct WaterState {
    pub water_level: f64,
    pub evaporation_rate: f64,
    pub environment_state: String,
}

#[tauri::command]
pub fn get_water_state(state: State<DbState>) -> AppResult<WaterState> {
    let db = state.0.lock().map_err(|_| {
        crate::utils::error::AppError::OperationFailed("Failed to lock database".to_string())
    })?;
    
    let (level, rate, env_state) = db.get_water_state()?;
    Ok(WaterState {
        water_level: level,
        evaporation_rate: rate,
        environment_state: env_state,
    })
}

#[tauri::command]
pub fn drink_water(amount: f64, state: State<DbState>) -> AppResult<f64> {
    let db = state.0.lock().map_err(|_| {
        crate::utils::error::AppError::OperationFailed("Failed to lock database".to_string())
    })?;
    
    let (current_level, _, _) = db.get_water_state()?;
    let new_level = (current_level + amount).min(1.0);
    db.update_water_level(new_level)?;
    Ok(new_level)
}

#[tauri::command]
pub fn evaporate_water(amount: f64, state: State<DbState>) -> AppResult<f64> {
    let db = state.0.lock().map_err(|_| {
        crate::utils::error::AppError::OperationFailed("Failed to lock database".to_string())
    })?;
    
    db.evaporate_water(amount)
}
