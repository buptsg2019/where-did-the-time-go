use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub is_archived: bool,
    pub created_at: String, // ISO 8601格式
    pub updated_at: String,
    pub deadline: Option<String>, // 未来功能
    pub is_daily: bool, // 未来功能
    pub reminder_enabled: bool, // 未来功能
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectRequest {
    pub id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub color: Option<String>,
    pub deadline: Option<String>,
    pub is_daily: Option<bool>,
    pub reminder_enabled: Option<bool>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_project_serialization() {
        let project = Project {
            id: 1,
            name: "测试项目".to_string(),
            description: Some("描述".to_string()),
            color: Some("#FF0000".to_string()),
            is_archived: false,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
            deadline: None,
            is_daily: false,
            reminder_enabled: false,
        };

        let json = serde_json::to_string(&project).unwrap();
        assert!(json.contains("测试项目"));

        let deserialized: Project = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, 1);
        assert_eq!(deserialized.name, "测试项目");
        assert_eq!(deserialized.description, Some("描述".to_string()));
    }

    #[test]
    fn test_create_project_request() {
        let request = CreateProjectRequest {
            name: "新项目".to_string(),
            description: Some("描述".to_string()),
            color: Some("#00FF00".to_string()),
        };

        assert_eq!(request.name, "新项目");
        assert_eq!(request.description, Some("描述".to_string()));
        assert_eq!(request.color, Some("#00FF00".to_string()));

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("新项目"));
    }

    #[test]
    fn test_update_project_request() {
        let request = UpdateProjectRequest {
            id: 1,
            name: Some("更新名称".to_string()),
            description: None,
            color: None,
            deadline: None,
            is_daily: Some(true),
            reminder_enabled: Some(false),
        };

        assert_eq!(request.id, 1);
        assert_eq!(request.name, Some("更新名称".to_string()));
        assert_eq!(request.is_daily, Some(true));
    }

    #[test]
    fn test_project_optional_fields() {
        let project = Project {
            id: 2,
            name: "最小化项目".to_string(),
            description: None,
            color: None,
            is_archived: true,
            created_at: "2024-06-01T12:00:00Z".to_string(),
            updated_at: "2024-06-01T12:00:00Z".to_string(),
            deadline: None,
            is_daily: true,
            reminder_enabled: true,
        };

        assert!(project.description.is_none());
        assert!(project.color.is_none());
        assert!(project.is_archived);
        assert!(project.is_daily);
        assert!(project.reminder_enabled);
    }
}

