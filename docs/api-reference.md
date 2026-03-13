# API参考文档

## 1. 概述

本文档描述了应用的前后端通信API接口。所有API通过Tauri IPC机制进行通信。

**通信方式**: Tauri IPC (invoke/command)

**数据格式**: JSON

## 2. API约定

### 2.1 请求格式

**前端调用**:
```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<ReturnType>('command_name', {
  param1: value1,
  param2: value2,
});
```

**后端定义**:
```rust
#[tauri::command]
fn command_name(param1: Type1, param2: Type2) -> Result<ReturnType> {
    // 处理逻辑
    Ok(result)
}
```

### 2.2 响应格式

**成功响应**: 返回数据对象
**错误响应**: 返回错误信息（字符串或错误对象）

### 2.3 错误处理

所有API都可能返回错误，前端需要进行错误处理：
```typescript
try {
  const result = await invoke('command_name', params);
} catch (error) {
  console.error('API调用失败:', error);
}
```

## 3. 工作项相关API

### 3.1 get_projects

获取所有工作项列表（不包括已归档的）

**请求**:
```typescript
invoke('get_projects')
```

**响应**:
```typescript
interface Project {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  is_archived: boolean;
  created_at: string; // ISO 8601格式
  updated_at: string;
  deadline: string | null; // 未来功能
  is_daily: boolean; // 未来功能
  reminder_enabled: boolean; // 未来功能
}

Project[]
```

### 3.2 get_project

获取单个工作项详情

**请求**:
```typescript
invoke('get_project', { id: number })
```

**响应**: `Project`

### 3.3 create_project

创建新工作项

**请求**:
```typescript
invoke('create_project', {
  name: string;
  description?: string;
  color?: string;
})
```

**响应**: `Project`

### 3.4 update_project

更新工作项

**请求**:
```typescript
invoke('update_project', {
  id: number;
  name?: string;
  description?: string;
  color?: string;
  deadline?: string | null; // 未来功能
  is_daily?: boolean; // 未来功能
  reminder_enabled?: boolean; // 未来功能
})
```

**响应**: `Project`

### 3.5 archive_project

归档工作项

**请求**:
```typescript
invoke('archive_project', { id: number })
```

**响应**: `void`

### 3.6 delete_project

删除工作项（物理删除，谨慎使用）

**请求**:
```typescript
invoke('delete_project', { id: number })
```

**响应**: `void`

## 4. 时间追踪相关API

### 4.1 start_timer

开始计时

**请求**:
```typescript
invoke('start_timer', { project_id: number })
```

**响应**:
```typescript
interface TimerState {
  id: number;
  project_id: number;
  start_time: string; // ISO 8601格式
  project: Project;
}

TimerState
```

### 4.2 stop_timer

停止计时

**请求**:
```typescript
invoke('stop_timer')
```

**响应**: `void`

### 4.3 get_current_timer

获取当前正在运行的计时

**请求**:
```typescript
invoke('get_current_timer')
```

**响应**: `TimerState | null`

### 4.4 get_time_records

获取时间记录列表

**请求**:
```typescript
invoke('get_time_records', {
  project_id?: number; // 可选，筛选特定工作项
  start_date?: string; // 可选，开始日期（ISO 8601）
  end_date?: string; // 可选，结束日期（ISO 8601）
})
```

**响应**:
```typescript
interface TimeRecord {
  id: number;
  project_id: number;
  start_time: string;
  end_time: string | null;
  duration: number | null; // 秒
  created_at: string;
}

TimeRecord[]
```

## 5. 统计相关API

### 5.1 get_statistics

获取统计数据

**请求**:
```typescript
invoke('get_statistics', {
  type: 'day' | 'week' | 'month';
  date: string; // ISO 8601格式的日期
})
```

**响应**:
```typescript
interface Statistics {
  total_duration: number; // 总时长（秒）
  project_stats: Array<{
    project_id: number;
    project_name: string;
    duration: number; // 时长（秒）
    percentage: number; // 百分比
  }>;
  date_range: {
    start: string;
    end: string;
  };
}

Statistics
```

### 5.2 export_report

导出报告

**请求**:
```typescript
invoke('export_report', {
  type: 'day' | 'week' | 'month';
  date: string;
  format: 'json' | 'csv';
})
```

**响应**: `string` (文件路径)

## 6. 喝水动画相关API（核心功能）

### 6.1 get_water_state

获取当前喝水状态

**请求**:
```typescript
invoke('get_water_state')
```

**响应**:
```typescript
interface WaterState {
  water_level: number; // 0.0 - 1.0
  evaporation_rate: number;
  environment_state: 'normal' | 'hot' | 'very_hot';
  last_update_time: string;
}

WaterState
```

### 6.2 drink_water

喝水操作（恢复水位）

**请求**:
```typescript
invoke('drink_water')
```

**响应**: `WaterState`

### 6.3 update_water_state

更新喝水状态（内部使用，前端通常不需要直接调用）

**请求**:
```typescript
invoke('update_water_state', {
  water_level?: number;
  evaporation_rate?: number;
  environment_state?: string;
})
```

**响应**: `WaterState`

## 7. 设置相关API

### 7.1 get_setting

获取设置值

**请求**:
```typescript
invoke('get_setting', { key: string })
```

**响应**: `any` (JSON值)

### 7.2 set_setting

设置值

**请求**:
```typescript
invoke('set_setting', {
  key: string;
  value: any; // JSON值
})
```

**响应**: `void`

### 7.3 get_all_settings

获取所有设置

**请求**:
```typescript
invoke('get_all_settings')
```

**响应**:
```typescript
Record<string, any>
```

## 8. 提醒相关API

### 8.1 get_reminder_settings

获取提醒设置

**请求**:
```typescript
invoke('get_reminder_settings')
```

**响应**:
```typescript
interface ReminderSettings {
  interval: number; // 提醒间隔（分钟）
  enabled: boolean;
  focus_mode: boolean; // 专注模式
}

ReminderSettings
```

### 8.2 update_reminder_settings

更新提醒设置

**请求**:
```typescript
invoke('update_reminder_settings', {
  interval?: number;
  enabled?: boolean;
  focus_mode?: boolean;
})
```

**响应**: `ReminderSettings`

## 9. 番茄钟相关API

### 9.1 start_pomodoro

开始番茄钟

**请求**:
```typescript
invoke('start_pomodoro', {
  duration?: number; // 时长（分钟），默认25
})
```

**响应**:
```typescript
interface PomodoroState {
  id: number;
  duration: number; // 秒
  start_time: string;
  type: 'work' | 'short_break' | 'long_break';
}

PomodoroState
```

### 9.2 stop_pomodoro

停止番茄钟

**请求**:
```typescript
invoke('stop_pomodoro')
```

**响应**: `void`

### 9.3 get_current_pomodoro

获取当前番茄钟状态

**请求**:
```typescript
invoke('get_current_pomodoro')
```

**响应**: `PomodoroState | null`

### 9.4 get_pomodoro_statistics

获取番茄钟统计

**请求**:
```typescript
invoke('get_pomodoro_statistics', {
  start_date?: string;
  end_date?: string;
})
```

**响应**:
```typescript
interface PomodoroStatistics {
  total_count: number;
  daily_count: number;
  weekly_count: number;
  monthly_count: number;
}

PomodoroStatistics
```

## 10. 自动点击相关API

### 10.1 start_click_automation

开始自动点击

**请求**:
```typescript
invoke('start_click_automation', {
  coordinates: Array<{ x: number; y: number }>;
  interval: number; // 间隔（毫秒）
  button: 'left' | 'right' | 'middle';
  drag?: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
})
```

**响应**: `void`

### 10.2 stop_click_automation

停止自动点击

**请求**:
```typescript
invoke('stop_click_automation')
```

**响应**: `void`

### 10.3 get_click_automation_state

获取自动点击状态

**请求**:
```typescript
invoke('get_click_automation_state')
```

**响应**:
```typescript
interface ClickAutomationState {
  is_running: boolean;
  coordinates: Array<{ x: number; y: number }>;
  interval: number;
  button: string;
}

ClickAutomationState | null
```

## 11. 窗口相关API

### 11.1 set_window_position

设置窗口位置

**请求**:
```typescript
invoke('set_window_position', {
  x: number;
  y: number;
})
```

**响应**: `void`

### 11.2 get_window_position

获取窗口位置

**请求**:
```typescript
invoke('get_window_position')
```

**响应**:
```typescript
{ x: number; y: number }
```

### 11.3 show_window

显示窗口

**请求**:
```typescript
invoke('show_window')
```

**响应**: `void`

### 11.4 hide_window

隐藏窗口

**请求**:
```typescript
invoke('hide_window')
```

**响应**: `void`

## 12. 系统集成相关API

### 12.1 set_auto_start

设置开机自启动

**请求**:
```typescript
invoke('set_auto_start', { enabled: boolean })
```

**响应**: `void`

### 12.2 get_auto_start

获取开机自启动状态

**请求**:
```typescript
invoke('get_auto_start')
```

**响应**: `boolean`

## 13. 事件（Events）

除了命令-响应模式的API，还支持事件订阅机制。

### 13.1 订阅事件

```typescript
import { listen } from '@tauri-apps/api/event';

const unsubscribe = await listen<PayloadType>('event_name', (event) => {
  console.log('收到事件:', event.payload);
});

// 取消订阅
unsubscribe();
```

### 13.2 可用事件

#### timer_tick

计时器tick事件（每秒触发一次）

**Payload**:
```typescript
{
  elapsed: number; // 已过去秒数
  project_id: number;
}
```

#### pomodoro_tick

番茄钟tick事件（每秒触发一次）

**Payload**:
```typescript
{
  remaining: number; // 剩余秒数
  type: 'work' | 'short_break' | 'long_break';
}
```

#### pomodoro_complete

番茄钟完成事件

**Payload**:
```typescript
{
  type: 'work' | 'short_break' | 'long_break';
}
```

#### reminder_triggered

提醒触发事件

**Payload**:
```typescript
{
  message: string;
  type: 'rest' | 'water';
}
```

#### water_state_changed

喝水状态变化事件

**Payload**:
```typescript
WaterState
```

## 14. 未来功能API（规划中）

### 14.1 AI相关API

- `analyze_work_habits`: 分析工作习惯
- `generate_plan`: 生成计划
- `get_ai_plans`: 获取AI计划列表
- `update_ai_plan`: 更新AI计划

### 14.2 翻译相关API

- `translate_text`: 翻译文本
- `ocr_screen_region`: OCR识别屏幕区域
- `start_translation_mode`: 启动翻译模式
- `stop_translation_mode`: 停止翻译模式

### 14.3 皮肤相关API

- `get_skins`: 获取皮肤列表
- `set_active_skin`: 设置激活的皮肤
- `get_active_skin`: 获取当前激活的皮肤

## 15. 错误码

常见的错误情况：

- `NOT_FOUND`: 资源未找到（如工作项不存在）
- `INVALID_PARAMETER`: 参数无效
- `DATABASE_ERROR`: 数据库错误
- `PERMISSION_DENIED`: 权限不足（如自动点击功能）
- `OPERATION_FAILED`: 操作失败

## 16. 使用示例

### 16.1 完整的工作流程

```typescript
// 1. 获取工作项列表
const projects = await invoke<Project[]>('get_projects');

// 2. 创建新工作项
const newProject = await invoke<Project>('create_project', {
  name: '写代码',
  color: '#3b82f6',
});

// 3. 开始计时
const timer = await invoke<TimerState>('start_timer', {
  project_id: newProject.id,
});

// 4. 订阅计时tick事件
await listen('timer_tick', (event) => {
  console.log('已过去:', event.payload.elapsed, '秒');
});

// 5. 停止计时
await invoke('stop_timer');

// 6. 获取统计数据
const stats = await invoke<Statistics>('get_statistics', {
  type: 'day',
  date: new Date().toISOString(),
});
```

### 16.2 喝水动画相关

```typescript
// 获取当前状态
const waterState = await invoke<WaterState>('get_water_state');

// 订阅状态变化事件
await listen('water_state_changed', (event) => {
  console.log('水位:', event.payload.water_level);
});

// 喝水
await invoke('drink_water');
```

## 17. 总结

本文档列出了所有可用的API接口。API设计遵循RESTful风格，使用清晰的命名和类型定义。所有API都有完整的TypeScript类型定义，确保类型安全。

