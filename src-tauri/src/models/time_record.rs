use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeRecord {
    pub id: i64,
    pub project_id: i64,
    pub start_time: String, // ISO 8601格式
    pub end_time: Option<String>,
    pub duration: Option<i64>, // 秒
    pub created_at: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_time_record_serialization() {
        let record = TimeRecord {
            id: 1,
            project_id: 1,
            start_time: "2024-01-01T09:00:00Z".to_string(),
            end_time: Some("2024-01-01T10:00:00Z".to_string()),
            duration: Some(3600),
            created_at: "2024-01-01T09:00:00Z".to_string(),
        };

        let json = serde_json::to_string(&record).unwrap();
        let deserialized: TimeRecord = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.id, 1);
        assert_eq!(deserialized.project_id, 1);
        assert_eq!(deserialized.duration, Some(3600));
        assert_eq!(deserialized.end_time, Some("2024-01-01T10:00:00Z".to_string()));
    }

    #[test]
    fn test_time_record_without_end_time() {
        let record = TimeRecord {
            id: 2,
            project_id: 1,
            start_time: "2024-01-01T09:00:00Z".to_string(),
            end_time: None,
            duration: None,
            created_at: "2024-01-01T09:00:00Z".to_string(),
        };

        assert!(record.end_time.is_none());
        assert!(record.duration.is_none());

        let json = serde_json::to_string(&record).unwrap();
        assert!(json.contains("null"));
    }
}

