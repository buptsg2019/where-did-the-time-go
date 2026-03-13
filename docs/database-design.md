# 数据库设计文档

## 1. 数据库选型

**选择: SQLite 3**

**理由**:
- 轻量化，无需单独数据库服务器
- 本地存储，保护用户隐私
- 性能优秀，适合单用户应用
- 跨平台支持良好
- Rust有成熟的SQLite库支持（rusqlite、sqlx）

## 2. 数据库设计原则

- **规范化**: 遵循数据库设计范式，避免数据冗余
- **扩展性**: 预留扩展字段，支持未来功能
- **性能**: 为常用查询字段添加索引
- **一致性**: 使用外键约束保证数据一致性
- **可维护性**: 表结构清晰，字段命名规范

## 3. 核心表设计

### 3.1 projects（工作项表）

**用途**: 存储工作项信息

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键，自增 |
| name | TEXT | NOT NULL | 工作项名称 |
| description | TEXT | | 工作项描述 |
| color | TEXT | | 颜色标签（十六进制颜色码） |
| is_archived | BOOLEAN | NOT NULL DEFAULT 0 | 是否已归档 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| deadline | DATETIME | | 截止日期（DDL模式，未来功能） |
| is_daily | BOOLEAN | NOT NULL DEFAULT 0 | 是否为日常模式（未来功能） |
| reminder_enabled | BOOLEAN | NOT NULL DEFAULT 0 | 是否启用AI提醒（未来功能） |

**索引**:
- PRIMARY KEY (id)
- INDEX idx_projects_is_archived (is_archived)
- INDEX idx_projects_created_at (created_at)

**SQL创建语句**:
```sql
CREATE TABLE projects (
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
);

CREATE INDEX idx_projects_is_archived ON projects(is_archived);
CREATE INDEX idx_projects_created_at ON projects(created_at);
```

### 3.2 time_records（时间记录表）

**用途**: 存储时间追踪记录，供统计和分析使用

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键，自增 |
| project_id | INTEGER | NOT NULL, FOREIGN KEY | 关联的工作项ID |
| start_time | DATETIME | NOT NULL | 开始时间 |
| end_time | DATETIME | | 结束时间（NULL表示正在计时） |
| duration | INTEGER | | 持续时间（秒），结束时可计算 |
| created_at | DATETIME | NOT NULL | 创建时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX idx_time_records_project_id (project_id)
- INDEX idx_time_records_start_time (start_time)
- INDEX idx_time_records_date (date(start_time))

**SQL创建语句**:
```sql
CREATE TABLE time_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_time_records_project_id ON time_records(project_id);
CREATE INDEX idx_time_records_start_time ON time_records(start_time);
```

### 3.3 settings（设置表）

**用途**: 存储应用设置

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键，自增 |
| key | TEXT | NOT NULL UNIQUE | 设置键 |
| value | TEXT | NOT NULL | 设置值（JSON格式） |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE INDEX idx_settings_key (key)

**SQL创建语句**:
```sql
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_settings_key ON settings(key);
```

**常用设置项**:
- `reminder_interval`: 提醒间隔（分钟，默认30）
- `focus_mode`: 是否开启专注模式（默认false）
- `pomodoro_duration`: 番茄钟时长（分钟，默认25）
- `pomodoro_short_break`: 短休息时长（分钟，默认5）
- `pomodoro_long_break`: 长休息时长（分钟，默认15）
- `window_position`: 窗口位置（JSON: {x, y}）
- `auto_start`: 是否开机自启动（默认false）

## 4. 核心功能表（喝水动画系统）

### 4.1 water_state（喝水状态表）

**用途**: 存储当前喝水状态（核心功能）

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键，自增 |
| water_level | REAL | NOT NULL DEFAULT 1.0 | 水位（0.0-1.0） |
| evaporation_rate | REAL | NOT NULL DEFAULT 0.0001 | 蒸发速率（每秒） |
| environment_state | TEXT | NOT NULL DEFAULT 'normal' | 环境状态（normal, hot, very_hot等） |
| last_update_time | DATETIME | NOT NULL | 最后更新时间 |
| created_at | DATETIME | NOT NULL | 创建时间 |

**SQL创建语句**:
```sql
CREATE TABLE water_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    water_level REAL NOT NULL DEFAULT 1.0,
    evaporation_rate REAL NOT NULL DEFAULT 0.0001,
    environment_state TEXT NOT NULL DEFAULT 'normal',
    last_update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 water_records（喝水记录表）

**用途**: 记录用户喝水行为（可选，用于统计和分析）

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键，自增 |
| drink_time | DATETIME | NOT NULL | 喝水时间 |
| water_level_before | REAL | NOT NULL | 喝水前水位 |
| water_level_after | REAL | NOT NULL | 喝水后水位 |
| created_at | DATETIME | NOT NULL | 创建时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX idx_water_records_drink_time (drink_time)

**SQL创建语句**:
```sql
CREATE TABLE water_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drink_time DATETIME NOT NULL,
    water_level_before REAL NOT NULL,
    water_level_after REAL NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_water_records_drink_time ON water_records(drink_time);
```

## 5. 未来功能表设计

### 5.1 AI功能相关表

#### 5.1.1 ai_plans（AI计划表）

**用途**: 存储AI生成的计划

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键，自增 |
| project_id | INTEGER | NOT NULL, FOREIGN KEY | 关联的工作项ID |
| plan_content | TEXT | NOT NULL | 计划内容 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| status | TEXT | NOT NULL DEFAULT 'pending' | 状态（pending, completed, cancelled） |
| completed_at | DATETIME | | 完成时间 |

**SQL创建语句**:
```sql
CREATE TABLE ai_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    plan_content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending',
    completed_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_plans_project_id ON ai_plans(project_id);
CREATE INDEX idx_ai_plans_status ON ai_plans(status);
```

#### 5.1.2 ai_reminders（AI提醒表）

**用途**: 存储AI生成的提醒

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键，自增 |
| project_id | INTEGER | NOT NULL, FOREIGN KEY | 关联的工作项ID |
| reminder_type | TEXT | NOT NULL | 提醒类型（ddl, daily） |
| reminder_time | DATETIME | NOT NULL | 提醒时间 |
| message | TEXT | NOT NULL | 提醒消息 |
| is_sent | BOOLEAN | NOT NULL DEFAULT 0 | 是否已发送 |
| sent_at | DATETIME | | 发送时间 |

**SQL创建语句**:
```sql
CREATE TABLE ai_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    reminder_type TEXT NOT NULL,
    reminder_time DATETIME NOT NULL,
    message TEXT NOT NULL,
    is_sent BOOLEAN NOT NULL DEFAULT 0,
    sent_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_reminders_project_id ON ai_reminders(project_id);
CREATE INDEX idx_ai_reminders_reminder_time ON ai_reminders(reminder_time);
CREATE INDEX idx_ai_reminders_is_sent ON ai_reminders(is_sent);
```

#### 5.1.3 work_habits（工作习惯表）

**用途**: 存储AI分析出的工作习惯

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键，自增 |
| project_id | INTEGER | NOT NULL, FOREIGN KEY | 关联的工作项ID |
| time_period | TEXT | NOT NULL | 时间段（morning, afternoon, evening, night） |
| frequency | INTEGER | NOT NULL DEFAULT 0 | 该时间段出现的频率 |
| confidence | REAL | NOT NULL DEFAULT 0.0 | 习惯强度（0.0-1.0） |
| last_updated | DATETIME | NOT NULL | 最后更新时间 |

**SQL创建语句**:
```sql
CREATE TABLE work_habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    time_period TEXT NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 0,
    confidence REAL NOT NULL DEFAULT 0.0,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, time_period)
);

CREATE INDEX idx_work_habits_project_id ON work_habits(project_id);
```

#### 5.1.4 ai_analysis_cache（AI分析缓存表）

**用途**: 缓存AI分析结果，避免重复分析

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键，自增 |
| cache_key | TEXT | NOT NULL UNIQUE | 缓存键（如：date+analysis_type） |
| cache_value | TEXT | NOT NULL | 缓存值（JSON格式） |
| expires_at | DATETIME | NOT NULL | 过期时间 |
| created_at | DATETIME | NOT NULL | 创建时间 |

**SQL创建语句**:
```sql
CREATE TABLE ai_analysis_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,
    cache_value TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_ai_analysis_cache_key ON ai_analysis_cache(cache_key);
CREATE INDEX idx_ai_analysis_cache_expires_at ON ai_analysis_cache(expires_at);
```

### 5.2 皮肤系统表

#### 5.2.1 skins（皮肤表）

**用途**: 存储皮肤信息

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键，自增 |
| name | TEXT | NOT NULL UNIQUE | 皮肤名称 |
| display_name | TEXT | NOT NULL | 显示名称 |
| skin_type | TEXT | NOT NULL | 皮肤类型（default, pet, character等） |
| resource_path | TEXT | NOT NULL | 资源路径 |
| config | TEXT | | 配置信息（JSON格式） |
| is_builtin | BOOLEAN | NOT NULL DEFAULT 1 | 是否为内置皮肤 |
| created_at | DATETIME | NOT NULL | 创建时间 |

**SQL创建语句**:
```sql
CREATE TABLE skins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    skin_type TEXT NOT NULL,
    resource_path TEXT NOT NULL,
    config TEXT,
    is_builtin BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_skins_name ON skins(name);
```

#### 5.2.2 user_skin（用户皮肤关联表）

**用途**: 存储用户当前使用的皮肤

**字段设计**:

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 主键，自增 |
| skin_id | INTEGER | NOT NULL, FOREIGN KEY | 关联的皮肤ID |
| is_active | BOOLEAN | NOT NULL DEFAULT 1 | 是否激活 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**SQL创建语句**:
```sql
CREATE TABLE user_skin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skin_id INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skin_id) REFERENCES skins(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_skin_is_active ON user_skin(is_active);
```

## 6. 数据库初始化

### 6.1 初始化流程

1. 检查数据库文件是否存在
2. 如果不存在，创建数据库文件
3. 执行建表SQL语句
4. 执行数据迁移（如果有）
5. 初始化默认数据（如默认皮肤、默认设置等）

### 6.2 数据迁移

**版本管理**:
- 使用版本号管理数据库结构
- 每次结构变更创建迁移脚本
- 应用启动时检查版本，执行必要的迁移

**迁移脚本示例**:
```sql
-- migration_001_initial.sql
-- 创建初始表结构

-- migration_002_add_ai_tables.sql
-- 添加AI相关表（未来功能）

-- migration_003_add_skin_tables.sql
-- 添加皮肤相关表（未来功能）
```

## 7. 数据备份和恢复

### 7.1 备份策略

- **自动备份**: 定期自动备份数据库文件
- **手动备份**: 用户可手动触发备份
- **备份位置**: 应用数据目录的backup子目录

### 7.2 恢复策略

- **自动恢复**: 检测到数据库损坏时自动从备份恢复
- **手动恢复**: 用户可选择备份文件恢复

## 8. 性能优化

### 8.1 索引优化

- 为常用查询字段添加索引
- 避免过度索引（影响写入性能）
- 定期分析查询性能，优化索引

### 8.2 查询优化

- 使用预编译语句（Prepared Statements）
- 避免N+1查询问题
- 使用连接（JOIN）而非多次查询

### 8.3 数据清理

- 定期清理过期数据（如旧的AI分析缓存）
- 归档旧的时间记录（可选）
- 压缩数据库（VACUUM）

## 9. 数据模型关系图

```
projects (1) ──< (N) time_records
projects (1) ──< (N) ai_plans
projects (1) ──< (N) ai_reminders
projects (1) ──< (N) work_habits
skins (1) ──< (N) user_skin
```

## 10. 总结

本数据库设计遵循规范化原则，核心表结构简洁清晰，同时为未来功能（AI、皮肤系统）预留了扩展空间。SQLite作为轻量级数据库，完全满足单用户应用的需求，同时保证了良好的性能和可靠性。

