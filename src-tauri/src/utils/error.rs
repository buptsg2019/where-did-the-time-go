use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),
    
    #[error("Operation failed: {0}")]
    OperationFailed(String),
}

pub type AppResult<T> = Result<T, AppError>;

impl From<AppError> for tauri::ipc::InvokeError {
    fn from(error: AppError) -> Self {
        tauri::ipc::InvokeError::from(error.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_error() {
        let sqlite_err = rusqlite::Error::InvalidQuery;
        let app_err: AppError = sqlite_err.into();

        assert!(matches!(app_err, AppError::Database(_)));
        assert!(app_err.to_string().contains("Database error"));
    }

    #[test]
    fn test_not_found_error() {
        let err = AppError::NotFound("项目 1".to_string());
        assert_eq!(err.to_string(), "Not found: 项目 1");
    }

    #[test]
    fn test_invalid_parameter_error() {
        let err = AppError::InvalidParameter("无效的名称".to_string());
        assert_eq!(err.to_string(), "Invalid parameter: 无效的名称");
    }

    #[test]
    fn test_io_error() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "文件不存在");
        let app_err: AppError = io_err.into();

        assert!(matches!(app_err, AppError::Io(_)));
        assert!(app_err.to_string().contains("IO error"));
    }

    #[test]
    fn test_serialization_error() {
        // Create a serde_json::Error by parsing invalid JSON
        let json_result: Result<serde_json::Value, _> = serde_json::from_str("invalid json");
        let json_err = json_result.unwrap_err();
        let app_err: AppError = json_err.into();

        assert!(matches!(app_err, AppError::Serialization(_)));
        assert!(app_err.to_string().contains("Serialization error"));
    }

    #[test]
    fn test_operation_failed_error() {
        let err = AppError::OperationFailed("操作超时".to_string());
        assert_eq!(err.to_string(), "Operation failed: 操作超时");
    }

    #[test]
    fn test_app_result_ok() {
        let result: AppResult<i32> = Ok(42);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 42);
    }

    #[test]
    fn test_app_result_err() {
        let result: AppResult<i32> = Err(AppError::NotFound("test".to_string()));
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::NotFound(_)));
    }
}
