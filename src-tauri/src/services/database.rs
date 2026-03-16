use rusqlite::Connection;
use crate::utils::error::{AppError, AppResult};
use crate::models::project::{Project, CreateProjectRequest, UpdateProjectRequest};
use crate::models::time_record::TimeRecord;
use std::path::PathBuf;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: PathBuf) -> AppResult<Self> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        
        let conn = Connection::open(&db_path)?;
        
        let db = Database { conn };
        db.init_schema()?;
        
        Ok(db)
    }
    
    pub fn new_in_memory() -> AppResult<Self> {
        let conn = Connection::open_in_memory()?;
        let db = Database { conn };
        db.init_schema()?;
        Ok(db)
    }
    
    fn init_schema(&self) -> AppResult<()> {
        // 创建projects表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                color TEXT,
                is_archived BOOLEAN NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                deadline DATETIME,
                is_daily BOOLEAN NOT NULL DEFAULT 0,
                reminder_enabled BOOLEAN NOT NULL DEFAULT 0
            )",
            [],
        )?;
        
        // 创建time_records表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS time_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME,
                duration INTEGER,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        // 创建settings表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL UNIQUE,
                value TEXT NOT NULL,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // 创建water_state表（核心功能）
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS water_state (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                water_level REAL NOT NULL DEFAULT 1.0,
                evaporation_rate REAL NOT NULL DEFAULT 0.0001,
                environment_state TEXT NOT NULL DEFAULT 'normal',
                last_update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // 创建water_records表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS water_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                drink_time DATETIME NOT NULL,
                water_level_before REAL NOT NULL,
                water_level_after REAL NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // 创建索引
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON projects(is_archived)",
            [],
        )?;
        
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at)",
            [],
        )?;
        
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_time_records_project_id ON time_records(project_id)",
            [],
        )?;
        
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_time_records_start_time ON time_records(start_time)",
            [],
        )?;
        
        // 初始化water_state（如果不存在）
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM water_state",
            [],
            |row| row.get(0),
        )?;
        
        if count == 0 {
            self.conn.execute(
                "INSERT INTO water_state (water_level, evaporation_rate, environment_state) VALUES (1.0, 0.0001, 'normal')",
                [],
            )?;
        }
        
        // 初始化默认设置
        self.init_default_settings()?;
        
        Ok(())
    }
    
    fn init_default_settings(&self) -> AppResult<()> {
        let default_settings = vec![
            ("reminder_interval", "30"),
            ("focus_mode", "false"),
            ("pomodoro_duration", "25"),
            ("pomodoro_short_break", "5"),
            ("pomodoro_long_break", "15"),
            ("auto_start", "false"),
        ];
        
        for (key, value) in default_settings {
            self.conn.execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?1, ?2)",
                [key, value],
            )?;
        }
        
        Ok(())
    }

    // Project CRUD operations
    pub fn get_projects(&self) -> AppResult<Vec<Project>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, color, is_archived, created_at, updated_at, deadline, is_daily, reminder_enabled 
             FROM projects 
             WHERE is_archived = 0 
             ORDER BY created_at DESC"
        )?;
        
        let projects = stmt.query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                color: row.get(3)?,
                is_archived: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
                deadline: row.get(7)?,
                is_daily: row.get(8)?,
                reminder_enabled: row.get(9)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(projects)
    }

    pub fn create_project(&self, request: &CreateProjectRequest) -> AppResult<Project> {
        self.conn.execute(
            "INSERT INTO projects (name, description, color) VALUES (?1, ?2, ?3)",
            rusqlite::params![
                &request.name, 
                request.description.as_deref().unwrap_or(""), 
                request.color.as_deref().unwrap_or("")
            ],
        )?;
        
        let id = self.conn.last_insert_rowid();
        
        let project = self.conn.query_row(
            "SELECT id, name, description, color, is_archived, created_at, updated_at, deadline, is_daily, reminder_enabled 
             FROM projects WHERE id = ?1",
            [id],
            |row| {
                Ok(Project {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    color: row.get(3)?,
                    is_archived: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                    deadline: row.get(7)?,
                    is_daily: row.get(8)?,
                    reminder_enabled: row.get(9)?,
                })
            },
        )?;
        
        Ok(project)
    }

    pub fn update_project(&self, request: &UpdateProjectRequest) -> AppResult<Project> {
        // Build dynamic update query
        let mut updates = Vec::new();
        let mut params: Vec<&dyn rusqlite::ToSql> = Vec::new();
        
        if let Some(name) = &request.name {
            updates.push("name = ?".to_string());
            params.push(name);
        }
        if let Some(description) = &request.description {
            updates.push("description = ?".to_string());
            params.push(description);
        }
        if let Some(color) = &request.color {
            updates.push("color = ?".to_string());
            params.push(color);
        }
        if let Some(deadline) = &request.deadline {
            updates.push("deadline = ?".to_string());
            params.push(deadline);
        }
        if let Some(is_daily) = &request.is_daily {
            updates.push("is_daily = ?".to_string());
            params.push(is_daily as &dyn rusqlite::ToSql);
        }
        if let Some(reminder_enabled) = &request.reminder_enabled {
            updates.push("reminder_enabled = ?".to_string());
            params.push(reminder_enabled as &dyn rusqlite::ToSql);
        }
        
        if !updates.is_empty() {
            let query = format!(
                "UPDATE projects SET {}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                updates.join(", ")
            );
            params.push(&request.id);
            self.conn.execute(&query, rusqlite::params_from_iter(params.iter()))?;
        }
        
        self.get_project_by_id(request.id)
    }

    pub fn get_project_by_id(&self, id: i64) -> AppResult<Project> {
        let project = self.conn.query_row(
            "SELECT id, name, description, color, is_archived, created_at, updated_at, deadline, is_daily, reminder_enabled 
             FROM projects WHERE id = ?1",
            [id],
            |row| {
                Ok(Project {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    color: row.get(3)?,
                    is_archived: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                    deadline: row.get(7)?,
                    is_daily: row.get(8)?,
                    reminder_enabled: row.get(9)?,
                })
            },
        ).map_err(|_| AppError::NotFound(format!("Project {} not found", id)))?;
        
        Ok(project)
    }

    pub fn archive_project(&self, id: i64) -> AppResult<()> {
        self.conn.execute(
            "UPDATE projects SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
            [id],
        )?;
        Ok(())
    }

    pub fn delete_project(&self, id: i64) -> AppResult<()> {
        self.conn.execute(
            "DELETE FROM projects WHERE id = ?1",
            [id],
        )?;
        Ok(())
    }

    // Timer operations
    pub fn start_timer(&self, project_id: i64) -> AppResult<i64> {
        // Check if there's an active timer
        if self.get_active_timer()?.is_some() {
            return Err(AppError::OperationFailed("Timer already running".to_string()));
        }
        
        self.conn.execute(
            "INSERT INTO time_records (project_id, start_time) VALUES (?1, datetime('now'))",
            [project_id],
        )?;
        
        Ok(self.conn.last_insert_rowid())
    }

    pub fn stop_timer(&self) -> AppResult<TimeRecord> {
        let active = self.get_active_timer()?
            .ok_or_else(|| AppError::NotFound("No active timer".to_string()))?;
        
        self.conn.execute(
            "UPDATE time_records 
             SET end_time = datetime('now'), 
                 duration = (julianday('now') - julianday(start_time)) * 86400 
             WHERE id = ?1",
            [active.id],
        )?;
        
        self.get_time_record_by_id(active.id)
    }

    pub fn get_active_timer(&self) -> AppResult<Option<TimeRecord>> {
        let result = self.conn.query_row(
            "SELECT id, project_id, start_time, end_time, duration, created_at 
             FROM time_records 
             WHERE end_time IS NULL 
             ORDER BY start_time DESC 
             LIMIT 1",
            [],
            |row| {
                Ok(TimeRecord {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    start_time: row.get(2)?,
                    end_time: row.get(3)?,
                    duration: row.get(4)?,
                    created_at: row.get(5)?,
                })
            },
        );
        
        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn get_time_record_by_id(&self, id: i64) -> AppResult<TimeRecord> {
        let record = self.conn.query_row(
            "SELECT id, project_id, start_time, end_time, duration, created_at 
             FROM time_records WHERE id = ?1",
            [id],
            |row| {
                Ok(TimeRecord {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    start_time: row.get(2)?,
                    end_time: row.get(3)?,
                    duration: row.get(4)?,
                    created_at: row.get(5)?,
                })
            },
        ).map_err(|_| AppError::NotFound(format!("Time record {} not found", id)))?;
        
        Ok(record)
    }

    // Water state operations
    pub fn get_water_state(&self) -> AppResult<(f64, f64, String)> {
        let result = self.conn.query_row(
            "SELECT water_level, evaporation_rate, environment_state FROM water_state LIMIT 1",
            [],
            |row| {
                let level: f64 = row.get(0)?;
                let rate: f64 = row.get(1)?;
                let state: String = row.get(2)?;
                Ok((level, rate, state))
            },
        )?;
        Ok(result)
    }

    pub fn update_water_level(&self, new_level: f64) -> AppResult<()> {
        let current = self.get_water_state()?;
        
        self.conn.execute(
            "INSERT INTO water_records (drink_time, water_level_before, water_level_after) 
             VALUES (datetime('now'), ?1, ?2)",
            [current.0, new_level],
        )?;
        
        self.conn.execute(
            "UPDATE water_state SET water_level = ?1, last_update_time = datetime('now')",
            [new_level],
        )?;
        
        Ok(())
    }

    pub fn evaporate_water(&self, amount: f64) -> AppResult<f64> {
        let (current_level, _, _) = self.get_water_state()?;
        let new_level = (current_level - amount).max(0.0);
        
        self.conn.execute(
            "UPDATE water_state SET water_level = ?1, last_update_time = datetime('now')",
            [new_level],
        )?;
        
        Ok(new_level)
    }
    
    pub fn get_connection(&self) -> &Connection {
        &self.conn
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_in_memory() {
        let db = Database::new_in_memory();
        assert!(db.is_ok());
    }

    #[test]
    fn test_init_schema() {
        let db = Database::new_in_memory().unwrap();
        let conn = db.get_connection();

        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table'")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert!(tables.contains(&"projects".to_string()));
        assert!(tables.contains(&"time_records".to_string()));
        assert!(tables.contains(&"settings".to_string()));
        assert!(tables.contains(&"water_state".to_string()));
        assert!(tables.contains(&"water_records".to_string()));
    }

    #[test]
    fn test_water_state_initialized() {
        let db = Database::new_in_memory().unwrap();
        let conn = db.get_connection();

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM water_state", [], |row| row.get(0))
            .unwrap();

        assert_eq!(count, 1);
    }

    #[test]
    fn test_default_settings() {
        let db = Database::new_in_memory().unwrap();
        let conn = db.get_connection();

        let settings_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM settings", [], |row| row.get(0))
            .unwrap();

        assert!(settings_count >= 6);
    }

    #[test]
    fn test_water_state_initial_values() {
        let db = Database::new_in_memory().unwrap();
        let conn = db.get_connection();

        let (level, rate, state): (f64, f64, String) = conn
            .query_row(
                "SELECT water_level, evaporation_rate, environment_state FROM water_state LIMIT 1",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();

        assert!((level - 1.0).abs() < f64::EPSILON);
        assert!((rate - 0.0001).abs() < f64::EPSILON);
        assert_eq!(state, "normal");
    }

    #[test]
    fn test_project_crud() {
        let db = Database::new_in_memory().unwrap();

        // Create project
        let request = CreateProjectRequest {
            name: "测试项目".to_string(),
            description: Some("项目描述".to_string()),
            color: Some("#FF0000".to_string()),
        };
        
        let project = db.create_project(&request).unwrap();
        assert_eq!(project.name, "测试项目");

        // Get projects
        let projects = db.get_projects().unwrap();
        assert_eq!(projects.len(), 1);

        // Update project
        let update = UpdateProjectRequest {
            id: project.id,
            name: Some("更新后的项目".to_string()),
            description: None,
            color: None,
            deadline: None,
            is_daily: None,
            reminder_enabled: None,
        };
        let updated = db.update_project(&update).unwrap();
        assert_eq!(updated.name, "更新后的项目");

        // Archive project
        db.archive_project(project.id).unwrap();
        let projects = db.get_projects().unwrap();
        assert_eq!(projects.len(), 0);
    }

    #[test]
    fn test_timer_operations() {
        let db = Database::new_in_memory().unwrap();

        // Create a project first
        let request = CreateProjectRequest {
            name: "测试项目".to_string(),
            description: None,
            color: None,
        };
        let project = db.create_project(&request).unwrap();

        // Start timer
        let timer_id = db.start_timer(project.id).unwrap();
        assert!(timer_id > 0);

        // Get active timer
        let active = db.get_active_timer().unwrap();
        assert!(active.is_some());
        assert_eq!(active.unwrap().project_id, project.id);

        // Stop timer
        let record = db.stop_timer().unwrap();
        assert!(record.end_time.is_some());
        assert!(record.duration.is_some());
    }

    #[test]
    fn test_water_operations() {
        let db = Database::new_in_memory().unwrap();

        // Get initial state
        let (level, rate, state) = db.get_water_state().unwrap();
        assert_eq!(level, 1.0);

        // Drink water (update level)
        db.update_water_level(0.8).unwrap();
        let (new_level, _, _) = db.get_water_state().unwrap();
        assert_eq!(new_level, 0.8);

        // Evaporate
        let after_evap = db.evaporate_water(0.1).unwrap();
        assert_eq!(after_evap, 0.7);
    }
}
