# where-did-the-time-go

> 一款心疼你多喝水的小助手 ✨

一个现代化、轻量化的跨平台工作时间追踪和管理桌面应用，采用 Tauri（Rust + Web前端）技术栈，实现低内存占用、Apple风格设计。**核心特色是悬浮球内的喝水动画系统，作为用户核心乐趣点**。

## 🌟 核心特色

- 💧 **喝水动画系统**: 悬浮球内的水晃动动效，喝水后水慢慢蒸发，蒸干后变成炎热天气等状态
- ⏱️ **工作时间追踪**: 精准记录你的工作时间，支持多工作项管理
- 📊 **数据统计**: 天/周/月维度的时间统计，可视化图表展示
- 🎯 **番茄钟模式**: 专注工作，提高效率
- 🤖 **自动点击**: 支持鼠标自动化操作（跨平台）
- 🔔 **智能提醒**: 可配置的休息提醒，关爱你的健康
- 🎨 **Apple风格设计**: 流畅的60fps动画，优雅的用户体验

## 🚀 技术栈

- **框架**: Tauri 2.x（Rust后端 + Web前端，内存占用<50MB）
- **前端框架**: React 18 + TypeScript
- **UI库**: Tailwind CSS + shadcn/ui（现代化组件）
- **动画**: Framer Motion（Apple风格流畅动画）
- **数据存储**: SQLite（使用rusqlite或sqlx）
- **状态管理**: Zustand（轻量级状态管理）
- **构建工具**: Vite
- **打包**: Tauri CLI（支持Windows/macOS/Linux多平台打包）

## 📋 功能规划

### 当前版本功能

- ✅ 悬浮球界面（无边框、始终置顶、展开/收起动画）
- ✅ 工作项管理（添加、编辑、归档）
- ✅ 时间追踪（开始/暂停计时）
- ✅ 时间统计和报告（天/周/月维度）
- ✅ 喝水动画系统（核心功能）
- ✅ 休息提醒
- ✅ 自动点击功能
- ✅ 番茄钟模式
- ✅ 系统托盘集成
- ✅ 开机自启动

### 未来功能（规划中）

- 🔜 AI工作分析和习惯识别
- 🔜 AI计划生成和智能提醒（DDL模式、日常模式）
- 🔜 AI实时翻译（OCR + 屏幕区域选择）
- 🔜 皮肤系统（萌宠、美少女等主题）
- 🔜 用户自定义皮肤

## 📦 安装

### 开发环境要求

- **Node.js**: >= 18.0.0
- **Rust**: >= 1.70.0
- **系统**: Windows 10+ / macOS 10.15+ / Linux (Ubuntu 20.04+)

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/your-username/where-did-the-time-go.git
cd where-did-the-time-go

# 安装依赖
npm install

# 开发模式运行
npm run tauri dev

# 构建生产版本
npm run tauri build
```

## 🏗️ 项目结构

```
where-did-the-time-go/
├── docs/                          # 文档目录
│   ├── requirements.md            # 需求分析文档
│   ├── architecture.md            # 软件架构文档
│   └── database-design.md         # 数据库设计文档
├── src/                           # 前端代码
│   ├── components/                # UI组件
│   ├── stores/                    # Zustand状态管理
│   ├── hooks/                     # 自定义React Hooks
│   └── utils/                     # 工具函数
├── src-tauri/                     # Tauri后端代码
│   ├── src/
│   │   ├── main.rs                # 应用入口
│   │   ├── commands/              # Tauri命令（IPC handlers）
│   │   ├── services/              # 业务逻辑服务
│   │   └── models/                # 数据模型
│   └── Cargo.toml
├── public/                        # 静态资源
└── README.md
```

## 📖 开发文档

- 项目开发计划: 详细的开发计划和架构设计（见计划文档）
- [项目进度跟踪](PROJECT_PROGRESS.md): 实时更新的项目进度

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 [GNU General Public License v3.0](LICENSE) 许可证。

## 🙏 致谢

- [Tauri](https://tauri.app/) - 跨平台应用框架
- [React](https://react.dev/) - UI框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库

---

**这是一款心疼你多喝水的小助手** 💧
