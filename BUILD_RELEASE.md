# 自动打包发布指南

## 快速开始

### 方式 1：手动触发打包（推荐）

1. 将代码推送到 GitHub
   ```bash
   git add .
   git commit -m "feat: 添加 GitHub Actions 自动打包"
   git push
   ```

2. 进入 GitHub 仓库页面

3. 点击上方 **Actions** 标签

4. 选择左侧 **"Build and Release"** 工作流

5. 点击右侧 **"Run workflow"** 按钮
   - 选择分支（通常是 `main` 或 `master`）
   - 点击绿色的 **"Run workflow"**

6. 等待约 10-15 分钟

7. 完成后，在页面底部找到 **Artifacts** 区域
   - 下载 `windows-installer` 压缩包
   - 解压后得到 `.msi` 安装程序

### 方式 2：自动发布 Release（正式版本）

创建版本标签触发自动发布：

```bash
# 1. 更新版本号（修改 package.json 和 tauri.conf.json 中的 version）

# 2. 提交更改
git add .
git commit -m "release: v0.1.0"

# 3. 创建标签（v开头）
git tag v0.1.0

# 4. 推送标签到 GitHub
git push origin v0.1.0
```

推送后，GitHub Actions 会自动：
- 构建 Windows 安装包
- 创建 Release 页面
- 上传 `.msi` 和 `.exe` 安装文件

### 方式 3：每次推送自动打包

每当代码推送到 `main` 或 `master` 分支时，GitHub Actions 会自动运行构建。你可以在 Actions 页面下载构建产物。

---

## 工作流说明

### 配置的工作流

| 工作流文件 | 功能 | 触发条件 |
|-----------|------|---------|
| `.github/workflows/build.yml` | 构建 Windows 安装包 | 手动触发、推送标签、推送到main分支 |
| `.github/workflows/test.yml` | 运行测试和代码检查 | 每次推送和PR |

### 构建输出

构建完成后，你可以在以下位置找到安装包：

```
windows-installer.zip
├── *.msi        # Windows 安装程序（推荐）
└── *.exe        # 便携版可执行文件
```

---

## 安装使用

### 安装步骤

1. 下载 `.msi` 文件

2. 双击运行安装程序

3. 按照向导完成安装

4. 从开始菜单或桌面快捷方式启动应用

### 便携版使用

如果不想安装，可以直接运行 `.exe` 文件（如果有生成）。

---

## 故障排除

### 构建失败怎么办？

1. 检查 Actions 日志中的错误信息

2. 常见问题：
   - **前端构建失败**：检查 `npm run build` 是否在本地能成功
   - **Rust 编译失败**：检查 `cargo check` 是否在 `src-tauri` 目录能成功
   - **测试失败**：检查 `npm run test:run` 是否能通过

3. 本地测试构建：
   ```bash
   # 前端构建
   npm run build
   
   # 完整打包（需要 Rust 环境）
   npm run tauri build
   ```

---

## 高级配置

### 修改应用信息

编辑 `src-tauri/tauri.conf.json`：

```json
{
  "productName": "时间去哪了",
  "version": "0.1.0",
  "identifier": "com.wheredidthetimego.app"
}
```

### 更换图标

替换 `src-tauri/icons/` 目录下的图标文件：
- `icon32x32.png` - 小图标
- `icon128x128.png` - 大图标

### 添加更多构建目标

编辑 `.github/workflows/build.yml`，在 `strategy.matrix` 中添加：

```yaml
strategy:
  matrix:
    platform: [windows-latest, macos-latest, ubuntu-latest]
```

---

## 发布到 GitHub Releases

自动发布配置已包含在工作流中。只需推送标签：

```bash
git tag v0.1.0
git push origin v0.1.0
```

然后访问：
```
https://github.com/你的用户名/仓库名/releases
```

即可看到自动创建的发布页面和安装包。
