# AGENTS.md - AI Coding Agent Guide

> This document provides essential information for AI coding agents working on the `where-did-the-time-go` project.

## Project Overview

**where-did-the-time-go** (时间去哪了) is a modern, lightweight cross-platform desktop application for work time tracking and management. It's designed as a "hydration reminder assistant" (一款心疼你多喝水的小助手) with a unique floating ball interface containing an animated water system as its core feature.

- **Version**: 0.1.0
- **License**: GPL-3.0
- **Language**: Chinese (zh-CN) - All UI text and documentation are in Chinese

### Core Features

1. **Water Animation System** (喝水动画系统) - Core feature: Water sloshing animation inside the floating ball that evaporates over time, changing to different environmental states
2. **Work Time Tracking** (工作时间追踪) - Track time spent on different projects/work items
3. **Pomodoro Timer** (番茄钟模式) - Focus mode with customizable timer
4. **Auto-Click** (自动点击) - Cross-platform mouse automation
5. **Smart Reminders** (智能提醒) - Configurable break reminders
6. **Statistics** (数据统计) - Day/week/month time statistics with visualization

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.4 + CSS Variables (shadcn/ui design system)
- **Animation**: Framer Motion (for Apple-style 60fps animations)
- **State Management**: Zustand
- **Tauri API**: `@tauri-apps/api` v2.0

### Backend
- **Framework**: Tauri 2.x (Rust)
- **Database**: SQLite (via `rusqlite` crate)
- **Plugins**:
  - `tauri-plugin-shell` - System shell access
  - `tauri-plugin-autostart` - Auto-start on boot
- **Key Crates**: `serde`, `chrono`, `anyhow`, `thiserror`

### Development Tools
- **Linting**: ESLint 9.x with TypeScript, React, and Prettier plugins
- **Formatting**: Prettier 3.x (2-space tabs, semicolons, double quotes)
- **TypeScript**: Strict mode enabled, path alias `@/*` maps to `./src/*`

## Project Structure

```
where-did-the-time-go/
├── src/                           # Frontend source code
│   ├── components/                # React UI components
│   │   ├── FloatingBall.tsx       # Main floating ball component
│   │   └── Button.tsx             # Reusable Button component
│   ├── stores/                    # Zustand state management
│   │   ├── timerStore.ts          # Timer state management
│   │   └── projectStore.ts        # Project state management
│   ├── styles/                    # Global styles
│   │   └── index.css              # Tailwind directives + CSS variables
│   ├── utils/                     # Utility functions
│   │   └── cn.ts                  # Tailwind class merging (clsx + tailwind-merge)
│   ├── App.tsx                    # Root React component
│   └── main.tsx                   # React entry point
├── src-tauri/                     # Rust backend code
│   ├── src/
│   │   ├── main.rs                # Application entry point
│   │   ├── commands/              # Tauri IPC command handlers
│   │   │   ├── mod.rs
│   │   │   ├── project_commands.rs    # Project CRUD commands
│   │   │   └── timer_commands.rs      # Timer control commands
│   │   ├── models/                # Data models
│   │   │   ├── mod.rs
│   │   │   ├── project.rs         # Project data structures
│   │   │   └── time_record.rs     # Time record data structures
│   │   ├── services/              # Business logic services
│   │   │   ├── mod.rs
│   │   │   ├── database.rs        # SQLite database service
│   │   │   └── timer.rs           # Timer service
│   │   └── utils/                 # Utility modules
│   │       ├── mod.rs
│   │       └── error.rs           # Error types (AppError, AppResult)
│   ├── Cargo.toml                 # Rust dependencies
│   └── tauri.conf.json            # Tauri configuration
├── docs/                          # Documentation (in Chinese)
│   ├── architecture.md            # Software architecture document
│   ├── tech-stack.md              # Technology selection document
│   ├── database-design.md         # Database design document
│   ├── requirements.md            # Requirements analysis
│   └── api-reference.md           # API reference
├── BUILD.md                       # Build and packaging instructions
└── PROJECT_PROGRESS.md            # Project progress tracking
```

## Build and Development Commands

### Prerequisites
- Node.js >= 18.0.0
- Rust >= 1.70.0

### Development
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run tauri dev

# Frontend dev server only (port 1420)
npm run dev
```

### Building
```bash
# Build production version
npm run tauri build

# Build frontend only
npm run build
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check Prettier formatting
npm run format:check
```

### Rust Commands (in `src-tauri/` directory)
```bash
# Format Rust code
cargo fmt

# Run Rust linter
cargo clippy

# Build Rust only
cargo build
```

## Code Style Guidelines

### TypeScript/React
- Use **functional components** with hooks
- Use **TypeScript strict mode** - all variables must be typed
- Use **double quotes** for strings (Prettier configured)
- Use **2-space indentation**
- Use **semicolons** at end of statements
- Use **`@/` alias** for imports from `src/` directory

### Component Pattern Example
```typescript
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTimerStore } from "@/stores/timerStore";

// Use interface for props
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

function MyComponent({ title, onAction }: MyComponentProps) {
  // Use Zustand for state management
  const { currentTimer, startTimer } = useTimerStore();
  
  // Chinese UI text
  const buttonText = "开始计时";
  
  return (
    <div className="bg-card border-border rounded-lg">
      <h1 className="text-foreground font-semibold">{title}</h1>
    </div>
  );
}
```

### Rust
- Follow Rust naming conventions (snake_case for functions/variables, PascalCase for types)
- Use `anyhow` and `thiserror` for error handling
- Return `AppResult<T>` from command handlers
- Use `#[tauri::command]` attribute for IPC functions

### Tailwind CSS
- Use **CSS variables** for colors (defined in `index.css`):
  - `--background`, `--foreground`
  - `--primary`, `--primary-foreground`
  - `--card`, `--card-foreground`
  - `--border`, `--muted`, `--accent`, `--destructive`
- Use **HSL format** for colors: `hsl(var(--primary))`

## Architecture Overview

### Data Flow
```
User Action → React Component → Zustand Store → IPC invoke → 
Rust Command → Service Layer → SQLite Database
```

### IPC Commands (Frontend ↔ Backend)
Defined in `src-tauri/src/main.rs`:
- `get_projects` - Get all projects
- `create_project` - Create new project
- `update_project` - Update project
- `archive_project` - Archive project
- `delete_project` - Delete project
- `start_timer` - Start tracking time
- `stop_timer` - Stop tracking time
- `get_current_timer` - Get active timer

### Database Schema (SQLite)
**Core Tables**:
- `projects` - Work items (id, name, description, color, is_archived, created_at, updated_at)
- `time_records` - Time tracking records (id, project_id, start_time, end_time, duration)
- `settings` - App settings (key, value)
- `water_state` - Water animation state (water_level, evaporation_rate, environment_state)
- `water_records` - Water drinking history

See `src-tauri/src/services/database.rs` for full schema.

## Testing Strategy

Currently, the project is in early development (Stage 1). Testing infrastructure is not yet set up.

### Planned Testing Approach
- **Frontend**: Vitest for unit tests, React Testing Library for component tests
- **Backend**: Rust built-in test framework (`cargo test`)
- **E2E**: Consider Tauri Driver for end-to-end testing

## Security Considerations

1. **Local Data Only**: All data is stored locally in SQLite - no cloud storage
2. **CSP**: Content Security Policy configured in `tauri.conf.json`
3. **Window Configuration**: 
   - Frameless window (`decorations: false`)
   - Always on top (`alwaysOnTop: true`)
   - Transparent background (`transparent: true`)
   - Skip taskbar (`skipTaskbar: true`)
4. **Auto-start**: Uses `tauri-plugin-autostart` for boot-time launching

## Window Configuration

The app uses a unique floating ball interface:
- **Size**: 400x400 pixels
- **Position**: Top-left corner (x: 50, y: 50)
- **Style**: Borderless, transparent, always on top
- **Drag**: Enabled via `data-tauri-drag-region` attribute (when collapsed)

## Important Notes for AI Agents

1. **Language Consistency**: All UI text, comments, and documentation must be in **Chinese (zh-CN)**

2. **Core Feature Priority**: The **water animation system** (喝水动画系统) is the core feature and should be prioritized

3. **TODO Markers**: Many backend commands are stubbed with `// TODO:` comments - implement these incrementally

4. **Database**: The database service is initialized with schema in `database.rs` - check there for table structures

5. **State Management**: Use Zustand stores for all frontend state, not React Context

6. **Styling**: Use Tailwind CSS with the project's CSS variable system for consistent theming

7. **Animation**: Use Framer Motion for all animations to maintain Apple-style smoothness (60fps)

8. **Error Handling**: 
   - Frontend: Use try-catch with console.error for IPC calls
   - Backend: Use `AppResult<T>` return type with proper error propagation

9. **Icons**: The app needs icon files in `src-tauri/icons/` for packaging (see BUILD.md)

10. **File Paths**: Use forward slashes `/` in code even on Windows (handled by tools)

## Current Development Status

Refer to `PROJECT_PROGRESS.md` for detailed progress.

**Current Phase**: Stage 1 - Project Foundation Setup (进行中)

Completed:
- ✅ Project planning documents
- ✅ LICENSE (GPL-3.0)
- ✅ .gitignore
- ✅ Basic Tauri + React + TypeScript setup
- ✅ ESLint + Prettier configuration
- ✅ Tailwind CSS + shadcn/ui styling setup
- ✅ Database schema design
- ✅ Zustand stores (timerStore, projectStore)

In Progress:
- ⏳ Tauri command implementation
- ⏳ Floating ball UI

Pending:
- 🔲 Water animation system (core feature)
- 🔲 System tray integration
- 🔲 Auto-click functionality
- 🔲 Statistics and reporting

## References

- [Tauri Documentation](https://tauri.app/)
- [React Documentation](https://react.dev/)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://docs.pmnd.rs/zustand)
