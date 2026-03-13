# 自动化测试框架文档

> 本文档描述了 "where-did-the-time-go" 项目的自动化测试框架配置和使用方法。

## 测试框架概述

本项目采用双栈测试策略：
- **前端**: Vitest + React Testing Library
- **后端**: Rust 内置测试框架 (cargo test)

## 项目结构

```
where-did-the-time-go/
├── src/
│   ├── test/
│   │   └── setup.ts              # 测试初始化和全局 Mock
│   ├── utils/
│   │   └── cn.test.ts            # 工具函数测试
│   ├── stores/
│   │   ├── projectStore.test.ts  # Project Store 测试
│   │   └── timerStore.test.ts    # Timer Store 测试
│   └── components/
│       └── Button.test.tsx       # React 组件测试
├── src-tauri/
│   └── src/
│       ├── services/
│       │   └── database.rs       # 包含数据库测试模块
│       ├── models/
│       │   ├── project.rs        # 包含项目模型测试
│       │   └── time_record.rs    # 包含时间记录模型测试
│       └── utils/
│           └── error.rs          # 包含错误处理测试
├── scripts/
│   └── test.ps1                  # 一键测试脚本
├── .github/workflows/
│   └── test.yml                  # GitHub Actions CI 配置
├── vitest.config.ts              # Vitest 配置文件
└── package.json                  # 测试脚本配置
```

## 前端测试

### 技术栈

| 工具 | 版本 | 用途 |
|------|------|------|
| Vitest | 1.6.0 | 测试框架（兼容 Node.js 18） |
| @testing-library/react | 16.x | React 组件测试 |
| @testing-library/jest-dom | 6.x | DOM 断言 |
| jsdom | 24.x | 浏览器环境模拟 |
| @vitest/coverage-v8 | 1.6.0 | 覆盖率报告 |

### 运行命令

```bash
# 交互式测试模式（开发时使用）
npm run test

# 单次运行所有测试
npm run test:run

# 生成覆盖率报告
npm run test:coverage
```

### 测试覆盖率

```
✓ src/utils/cn.test.ts (7 tests)
✓ src/stores/timerStore.test.ts (8 tests)
✓ src/stores/projectStore.test.ts (8 tests)
✓ src/components/Button.test.tsx (8 tests)

Test Files  4 passed (4)
     Tests  31 passed (31)
```

### 测试用例说明

#### cn.test.ts
测试 Tailwind 类名合并工具函数：
- 类名合并
- 条件类名处理
- 冲突类名解决（后者优先）
- falsy 值过滤
- 数组和对象语法

#### projectStore.test.ts
测试项目状态管理：
- 初始状态验证
- 获取项目列表
- 创建新项目
- 更新项目信息
- 归档项目
- 删除项目
- 错误处理

#### timerStore.test.ts
测试计时器状态管理：
- 初始状态验证
- 启动计时器
- 停止计时器
- 更新经过时间
- 重置状态
- 获取当前计时器

#### Button.test.tsx
测试 Button 组件：
- 默认渲染
- 点击事件处理
- 不同变体（default, destructive, outline, ghost, link）
- 不同尺寸（default, sm, lg, icon）
- 禁用状态
- 自定义 className
- ref 转发

## 后端测试

### 技术栈

| 工具 | 用途 |
|------|------|
| cargo test | Rust 内置测试框架 |
| 内存 SQLite | 数据库测试隔离 |

### 运行命令

```bash
# 需要在 src-tauri 目录下，且已安装 Rust

cd src-tauri
cargo test

# 详细输出
cargo test -- --nocapture

# 运行特定测试
cargo test test_database_in_memory
```

### 测试模块说明

#### database.rs 测试
- 内存数据库创建
- 数据库表结构初始化
- 水位状态初始化
- 默认设置初始化
- 项目 CRUD 操作
- 时间记录 CRUD 操作

#### project.rs 测试
- Project 结构体序列化/反序列化
- CreateProjectRequest 结构体验证
- UpdateProjectRequest 结构体验证
- 可选字段处理

#### time_record.rs 测试
- TimeRecord 结构体序列化/反序列化
- 无结束时间的记录处理

#### error.rs 测试
- 数据库错误转换
- 未找到错误
- 无效参数错误
- IO 错误转换
- 序列化错误转换
- 操作失败错误
- AppResult 类型验证

## CI/CD 集成

### GitHub Actions

配置位于 `.github/workflows/test.yml`：

```yaml
# 在以下情况触发测试：
# - push 到 main 或 develop 分支
# - pull request 到 main 分支

jobs:
  test-frontend:   # 前端测试任务
  test-backend:    # 后端测试任务
  lint-check:      # 代码质量检查
```

### 测试脚本

Windows 一键测试脚本：`scripts/test.ps1`

```powershell
# 运行所有测试
.\scripts\test.ps1
```

## 编写新测试

### 前端测试模板

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// 工具函数测试
describe("函数名", () => {
  it("应该正确执行...", () => {
    expect(result).toBe(expected);
  });
});

// 组件测试
describe("组件名", () => {
  it("应该渲染...", () => {
    render(<Component />);
    expect(screen.getByText("文本")).toBeInTheDocument();
  });
});
```

### 后端测试模板

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_function_name() {
        let result = function_to_test();
        assert_eq!(result, expected);
    }

    #[test]
    #[should_panic(expected = "错误信息")]
    fn test_error_case() {
        function_that_panics();
    }
}
```

## 注意事项

### Node.js 版本兼容性

- 当前项目使用 Node.js 18
- Vitest 1.6.0 兼容 Node.js 18
- 如需升级 Vitest 到 4.x，需要先升级 Node.js 到 20+

### Tauri API Mock

测试中已自动 Mock Tauri IPC 调用：

```typescript
// src/test/setup.ts
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));
```

### 数据库测试隔离

Rust 测试使用内存数据库确保隔离：

```rust
let db = Database::new_in_memory().unwrap();
```

## 覆盖率目标

| 模块 | 目标覆盖率 |
|------|-----------|
| 工具函数 | 90%+ |
| Zustand Stores | 80%+ |
| React 组件 | 70%+ |
| Rust 模型 | 80%+ |
| Rust 服务 | 70%+ |

## 故障排除

### 前端测试无法启动

1. 检查 Node.js 版本：`node --version`
2. 重新安装依赖：`npm install`
3. 清除 Vitest 缓存：`npx vitest --clearCache`

### 后端测试无法运行

1. 确认已安装 Rust：`rustc --version`
2. 检查 Cargo.toml 配置
3. 运行 `cargo check` 检查编译错误

### 测试超时

在 `vitest.config.ts` 中增加超时时间：

```typescript
test: {
  testTimeout: 10000, // 10秒
}
```
