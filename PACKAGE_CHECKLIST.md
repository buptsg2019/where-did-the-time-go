# 打包前检查清单

## ✅ 已完成

1. ✅ 图标文件已移动到正确位置
   - `src-tauri/icons/icon32x32.png`
   - `src-tauri/icons/icon128x128.png`

2. ✅ 配置文件已更新
   - `src-tauri/tauri.conf.json` 已配置图标路径

3. ✅ 悬浮球组件已实现
   - 展开/收缩动画
   - 时间追踪功能
   - 项目管理功能

## ⚠️ 需要完成

### 1. 安装 Rust 工具链

打包需要 Rust 环境。请按照以下步骤安装：

**方法一：使用 rustup（推荐）**

1. 访问 https://www.rust-lang.org/tools/install
2. 下载并运行 `rustup-init.exe`
3. 按照安装向导完成安装
4. **重要**：安装完成后需要**重新打开终端/PowerShell**，或者运行：
   ```powershell
   refreshenv  # 如果使用 Chocolatey
   # 或者手动重新加载环境变量
   ```

**方法二：使用 Chocolatey（如果已安装）**
```powershell
choco install rust
```

**验证安装**
安装完成后，在新终端中运行：
```powershell
rustc --version
cargo --version
```

### 2. 准备 Windows 图标文件（可选但推荐）

对于 Windows 打包，建议添加 `.ico` 文件：

- 将 `icon32x32.png` 和 `icon128x128.png` 转换为 `icon.ico`
- 可以使用在线工具：https://icoconvert.com/
- 将生成的 `icon.ico` 放在 `src-tauri/icons/` 目录
- 更新 `tauri.conf.json` 添加 `"icons/icon.ico"` 到 icon 数组

### 3. 开始打包

安装 Rust 后，在项目根目录运行：

```powershell
# 确保在项目根目录
cd D:\Software\where-did-the-time-go

# 开始打包（首次打包可能需要较长时间，因为需要编译 Rust 代码）
npm run tauri build
```

### 4. 打包输出位置

打包成功后，exe 文件会在：
- **MSI 安装包**：`src-tauri/target/release/bundle/msi/时间去哪了_0.1.0_x64_en-US.msi`
- **NSIS 安装包**：`src-tauri/target/release/bundle/nsis/时间去哪了_0.1.0_x64-setup.exe`
- **独立 exe**：`src-tauri/target/release/时间去哪了.exe`（可能）

## 📝 注意事项

1. **首次打包时间**：第一次打包可能需要 10-30 分钟，因为需要下载和编译 Rust 依赖
2. **网络连接**：确保网络连接正常，需要下载 Rust 依赖
3. **磁盘空间**：确保有足够的磁盘空间（至少 1GB）
4. **杀毒软件**：首次运行时，某些杀毒软件可能会误报，这是正常的

## 🔧 故障排除

### 问题：找不到 cargo 命令
- **解决**：安装 Rust 后，需要重新打开终端

### 问题：打包失败，提示缺少依赖
- **解决**：确保网络连接正常，cargo 会自动下载依赖

### 问题：图标文件找不到
- **解决**：确保图标文件在 `src-tauri/icons/` 目录下，且文件名与配置匹配

## 🚀 开发模式测试

在正式打包前，可以使用开发模式测试应用：

```powershell
npm run tauri dev
```

这将启动开发服务器并运行应用，无需完整打包。
