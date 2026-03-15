// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod services;
mod utils;

use commands::{
    project_commands::{self, DbState},
    timer_commands, water_commands,
};
use services::database::Database;
use std::sync::Mutex;
use tauri::{Emitter, Manager, WindowEvent};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            // Project commands
            project_commands::get_projects,
            project_commands::create_project,
            project_commands::update_project,
            project_commands::archive_project,
            project_commands::delete_project,
            // Timer commands
            timer_commands::start_timer,
            timer_commands::stop_timer,
            timer_commands::get_current_timer,
            timer_commands::get_today_total_time,
            // Water commands
            water_commands::get_water_state,
            water_commands::drink_water,
            water_commands::evaporate_water,
        ])
        .setup(|app| {
            // Initialize database
            let app_handle = app.handle();
            let app_dir = app_handle
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));
            
            std::fs::create_dir_all(&app_dir).ok();
            
            let db_path = app_dir.join("where-did-the-time-go.db");
            let database = Database::new(db_path).expect("Failed to initialize database");
            
            app.manage(DbState(Mutex::new(database)));
            
            // Set up water evaporation timer
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                loop {
                    std::thread::sleep(std::time::Duration::from_secs(60)); // Every minute
                    let _ = app_handle.emit("water_evaporation", ());
                }
            });
            
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Hide window instead of closing
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
