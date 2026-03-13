# 打包说明

## Windows平台打包

### 前提条件

1. 确保已安装所有依赖：
```bash
npm install
```

2. 确保已安装Rust和Tauri CLI：
```bash
# 安装Rust（如果还没有安装）
# 访问 https://www.rust-lang.org/tools/install

# 安装Tauri CLI（如果还没有安装）
npm install -g @tauri-apps/cli
```

### 图标文件

**重要**: 打包需要图标文件。请确保 `src-tauri/icons/` 目录中包含以下图标文件：

- `icon.ico` (Windows图标文件)
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`

如果没有图标文件，可以：
1. 使用在线工具生成图标（推荐：https://icoconvert.com/）
2. 或者从Tauri示例项目中复制图标文件

### 打包步骤

1. **构建前端资源**（可选，Tauri会自动构建）：
```bash
npm run build
```

2. **打包成Windows可执行文件**：
```bash
npm run tauri build
```

3. **查找生成的exe文件**：

打包完成后，exe文件会在以下位置：
```
src-tauri/target/release/bundle/msi/时间去哪了_0.1.0_x64_en-US.msi
src-tauri/target/release/bundle/nsis/时间去哪了_0.1.0_x64-setup.exe
```

### 打包选项

如果需要只生成特定格式的安装包，可以在 `src-tauri/tauri.conf.json` 中修改 `bundle.targets`：

```json
"bundle": {
  "targets": ["msi", "nsis"],  // 或者 "all" 生成所有格式
  ...
}
```

### 开发模式

在开发过程中，可以使用开发模式运行应用（无需打包）：

```bash
npm run tauri dev
```

这将启动开发服务器并运行应用。

### 注意事项

1. **透明窗口**: 本应用使用透明窗口，在某些Windows版本上可能需要启用DWM（Desktop Window Manager）
2. **杀毒软件**: 首次运行时，某些杀毒软件可能会误报，这是正常的
3. **权限**: 应用需要无边框窗口和置顶权限，请确保系统允许

### 故障排除

如果打包失败：

1. 检查Rust工具链是否完整：
```bash
rustc --version
cargo --version
```

2. 检查Tauri CLI版本：
```bash
tauri --version
```

3. 清理缓存并重新打包：
```bash
cd src-tauri
cargo clean
cd ..
npm run tauri build
```

4. 查看详细错误信息：
```bash
npm run tauri build -- --verbose
```
