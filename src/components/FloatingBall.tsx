import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimerStore } from "../stores/timerStore";
import { useProjectStore } from "../stores/projectStore";
import { useWaterStore } from "../stores/waterStore";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize, LogicalPosition } from "@tauri-apps/api/dpi";

// 悬浮球状态
type BallState = "floating" | "expanded" | "docked-left" | "docked-right" | "docked-top" | "docked-bottom";

// 常量定义
const BALL_SIZE = 80;
const DOCKED_VISIBLE_SIZE = 16;
const PANEL_WIDTH = 280;
const PANEL_HEIGHT = 420;
const DOCK_THRESHOLD = 30;

function FloatingBall() {
  const [ballState, setBallState] = useState<BallState>("floating");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isHoveringDocked, setIsHoveringDocked] = useState(false);
  
  const { currentTimer, elapsed, startTimer, stopTimer, fetchCurrentTimer, updateElapsed } = useTimerStore();
  const { projects, fetchProjects, createProject } = useProjectStore();
  const { waterLevel, fetchWaterState, drinkWater } = useWaterStore();
  
  const windowRef = useRef<ReturnType<typeof getCurrentWindow> | null>(null);
  const screenSizeRef = useRef({ width: 1920, height: 1080 });
  const positionRef = useRef({ x: 50, y: 50 });

  // 初始化
  useEffect(() => {
    const init = async () => {
      windowRef.current = getCurrentWindow();
      
      // 获取当前显示器尺寸
      try {
        const size = await windowRef.current.innerSize();
        // 估计屏幕尺寸（窗口初始位置在屏幕内）
        screenSizeRef.current = {
          width: Math.max(1920, size.width + 100),
          height: Math.max(1080, size.height + 100)
        };
      } catch (e) {
        // 使用默认值
      }
      
      // 设置初始窗口大小
      await windowRef.current.setSize(new LogicalSize(BALL_SIZE, BALL_SIZE));
    };
    
    init();
    fetchCurrentTimer();
    fetchProjects();
    fetchWaterState();
    
    const evapInterval = setInterval(() => {
      handleEvaporation();
    }, 60000);
    
    return () => clearInterval(evapInterval);
  }, []);

  // 计时器更新
  useEffect(() => {
    if (!currentTimer) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const start = Math.floor(new Date(currentTimer.start_time).getTime() / 1000);
      updateElapsed(now - start);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentTimer]);

  // 处理蒸发
  const handleEvaporation = async () => {
    if (waterLevel > 0) {
      const newLevel = await invoke<number>("evaporate_water", { amount: 0.02 });
      if (newLevel !== waterLevel) fetchWaterState();
    }
  };

  // 检测边缘吸附
  const checkDocking = (x: number, y: number): BallState | null => {
    const { width: screenW, height: screenH } = screenSizeRef.current;
    
    if (x <= DOCK_THRESHOLD) return "docked-left";
    if (x >= screenW - BALL_SIZE - DOCK_THRESHOLD) return "docked-right";
    if (y <= DOCK_THRESHOLD) return "docked-top";
    if (y >= screenH - BALL_SIZE - DOCK_THRESHOLD) return "docked-bottom";
    
    return null;
  };

  // 开始拖拽
  const handleDragStart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!windowRef.current) return;
    
    // 如果是吸附状态，先恢复
    if (ballState.startsWith("docked")) {
      setBallState("floating");
      await windowRef.current.setSize(new LogicalSize(BALL_SIZE, BALL_SIZE));
      // 将窗口移入屏幕内
      const pos = await windowRef.current.outerPosition();
      const { width: screenW, height: screenH } = screenSizeRef.current;
      let newX = pos.x;
      let newY = pos.y;
      
      if (pos.x < 0) newX = DOCK_THRESHOLD;
      if (pos.x > screenW - BALL_SIZE) newX = screenW - BALL_SIZE - DOCK_THRESHOLD;
      if (pos.y < 0) newY = DOCK_THRESHOLD;
      if (pos.y > screenH - BALL_SIZE) newY = screenH - BALL_SIZE - DOCK_THRESHOLD;
      
      await windowRef.current.setPosition(new LogicalPosition(newX, newY));
      positionRef.current = { x: newX, y: newY };
    }
    
    // 使用 Tauri 原生拖拽
    await windowRef.current.startDragging();
    
    // 拖拽结束后检测是否需要吸附
    setTimeout(async () => {
      if (!windowRef.current) return;
      const pos = await windowRef.current.outerPosition();
      positionRef.current = { x: pos.x, y: pos.y };
      
      const dockState = checkDocking(pos.x, pos.y);
      if (dockState) {
        setBallState(dockState);
        await applyDockPosition(dockState);
      }
    }, 100);
  };

  // 应用吸附位置
  const applyDockPosition = async (state: BallState) => {
    if (!windowRef.current) return;
    const { width: screenW, height: screenH } = screenSizeRef.current;
    
    let newX = positionRef.current.x;
    let newY = positionRef.current.y;
    let width = BALL_SIZE;
    let height = BALL_SIZE;
    
    switch (state) {
      case "docked-left":
        newX = -BALL_SIZE + DOCKED_VISIBLE_SIZE;
        width = DOCKED_VISIBLE_SIZE;
        break;
      case "docked-right":
        newX = screenW - DOCKED_VISIBLE_SIZE;
        width = DOCKED_VISIBLE_SIZE;
        break;
      case "docked-top":
        newY = -BALL_SIZE + DOCKED_VISIBLE_SIZE;
        height = DOCKED_VISIBLE_SIZE;
        break;
      case "docked-bottom":
        newY = screenH - DOCKED_VISIBLE_SIZE;
        height = DOCKED_VISIBLE_SIZE;
        break;
    }
    
    await windowRef.current.setPosition(new LogicalPosition(newX, newY));
    await windowRef.current.setSize(new LogicalSize(width, height));
    positionRef.current = { x: newX, y: newY };
  };

  // 点击悬浮球
  const handleBallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (ballState.startsWith("docked")) {
      // 从吸附状态展开
      setBallState("expanded");
      await expandFromDock();
    } else if (ballState === "expanded") {
      await closeExpanded();
    } else {
      setBallState("expanded");
      await windowRef.current?.setSize(new LogicalSize(BALL_SIZE + PANEL_WIDTH + 20, Math.max(BALL_SIZE, PANEL_HEIGHT)));
    }
  };

  // 从吸附状态展开
  const expandFromDock = async () => {
    if (!windowRef.current) return;
    const { width: screenW, height: screenH } = screenSizeRef.current;
    const pos = await windowRef.current.outerPosition();
    
    let newX = pos.x;
    let newY = pos.y;
    
    switch (ballState) {
      case "docked-left":
        newX = DOCK_THRESHOLD;
        break;
      case "docked-right":
        newX = screenW - BALL_SIZE - PANEL_WIDTH - 30;
        break;
      case "docked-top":
        newY = DOCK_THRESHOLD;
        break;
      case "docked-bottom":
        newY = screenH - PANEL_HEIGHT - 30;
        break;
    }
    
    await windowRef.current.setPosition(new LogicalPosition(newX, newY));
    await windowRef.current.setSize(new LogicalSize(BALL_SIZE + PANEL_WIDTH + 20, Math.max(BALL_SIZE, PANEL_HEIGHT)));
    positionRef.current = { x: newX, y: newY };
  };

  // 关闭展开状态
  const closeExpanded = async () => {
    setBallState("floating");
    setShowProjectModal(false);
    await windowRef.current?.setSize(new LogicalSize(BALL_SIZE, BALL_SIZE));
  };

  // 最小化到托盘
  const handleMinimize = async () => {
    await closeExpanded();
    await windowRef.current?.hide();
  };



  // 格式化时间
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // 处理项目点击
  const handleProjectClick = async (projectId: number) => {
    if (currentTimer) {
      await stopTimer();
    } else {
      await startTimer(projectId);
    }
  };

  // 创建项目
  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      await createProject(newProjectName.trim());
      setNewProjectName("");
      setShowProjectModal(false);
    }
  };

  // 喝水
  const handleDrinkWater = async () => {
    await drinkWater(0.2);
  };

  // 水波动画
  const waveVariants = {
    animate: {
      x: ["-100%", "0%"],
      transition: {
        x: { repeat: Infinity, repeatType: "loop" as const, duration: 3, ease: "linear" },
      },
    },
  };

  // 吸附状态下的悬停效果
  const handleDockedMouseEnter = async () => {
    if (!ballState.startsWith("docked")) return;
    setIsHoveringDocked(true);
    
    // 稍微移出一点，让用户知道可以交互
    if (!windowRef.current) return;
    const pos = await windowRef.current.outerPosition();
    const offset = 8;
    
    let newX = pos.x;
    let newY = pos.y;
    
    switch (ballState) {
      case "docked-left":
        newX = -BALL_SIZE + DOCKED_VISIBLE_SIZE + offset;
        break;
      case "docked-right":
        newX = screenSizeRef.current.width - DOCKED_VISIBLE_SIZE - offset;
        break;
      case "docked-top":
        newY = -BALL_SIZE + DOCKED_VISIBLE_SIZE + offset;
        break;
      case "docked-bottom":
        newY = screenSizeRef.current.height - DOCKED_VISIBLE_SIZE - offset;
        break;
    }
    
    await windowRef.current.setPosition(new LogicalPosition(newX, newY));
  };

  const handleDockedMouseLeave = async () => {
    if (!ballState.startsWith("docked")) return;
    setIsHoveringDocked(false);
    await applyDockPosition(ballState);
  };

  // 判断是否显示为吸附样式
  const isDocked = ballState.startsWith("docked");

  return (
    <div className="w-full h-full bg-transparent flex items-center justify-center select-none overflow-hidden">
      <div 
        className="relative"
        onMouseEnter={isDocked ? handleDockedMouseEnter : undefined}
        onMouseLeave={isDocked ? handleDockedMouseLeave : undefined}
      >
        {/* 悬浮球主体 */}
        <motion.div
          className={`relative ${isDocked ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
          onMouseDown={!isDocked && ballState !== "expanded" ? handleDragStart : undefined}
          onClick={handleBallClick}
          animate={{ scale: isHoveringDocked ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
          style={{
            clipPath: isDocked ? getDockedClipPath(ballState) : undefined,
          }}
        >
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg flex items-center justify-center overflow-hidden relative"
            whileHover={!isDocked ? { scale: 1.05 } : {}}
            whileTap={!isDocked ? { scale: 0.95 } : {}}
          >
            {/* 水波背景 */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ height: `${waterLevel * 100}%`, opacity: 0.8 }}
            />
            
            {/* 水波动画 */}
            {waterLevel > 0 && (
              <motion.div
                className="absolute w-[200%] h-4 -top-2"
                style={{
                  background: "repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px)",
                }}
                variants={waveVariants}
                animate="animate"
              />
            )}

            {/* 中心内容 */}
            <motion.div
              animate={{ rotate: ballState === "expanded" ? 45 : 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 text-white text-2xl font-bold drop-shadow-md"
            >
              {ballState === "expanded" ? "×" : "💧"}
            </motion.div>
          </motion.div>

          {/* 水位提示 */}
          {!isDocked && (
            <motion.div
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className={`font-medium ${waterLevel < 0.3 ? 'text-red-500' : 'text-blue-500'}`}>
                {Math.round(waterLevel * 100)}%
              </span>
            </motion.div>
          )}

          {/* 计时器显示 */}
          {currentTimer && !isDocked && (
            <motion.div
              className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap border border-gray-200 dark:border-gray-700 shadow-sm pointer-events-none"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {formatTime(elapsed)}
            </motion.div>
          )}
        </motion.div>

        {/* 展开面板 */}
        <AnimatePresence>
          {ballState === "expanded" && (
            <motion.div
              className="absolute left-24 top-0 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4 w-[280px]"
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 标题栏 */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-800 dark:text-gray-200">时间去哪了</span>
                <div className="flex gap-1">
                  <button
                    onClick={handleMinimize}
                    className="w-6 h-6 flex items-center justify-center text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title="最小化到托盘"
                  >
                    ─
                  </button>
                  <button
                    onClick={closeExpanded}
                    className="w-6 h-6 flex items-center justify-center text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title="收起"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* 喝水区域 */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">💧 记得喝水</span>
                    <span className={`text-xs font-medium ${waterLevel < 0.3 ? 'text-red-500' : 'text-blue-500'}`}>
                      {Math.round(waterLevel * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${waterLevel * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <button
                    onClick={handleDrinkWater}
                    className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                  >
                    喝一杯水 (+20%)
                  </button>
                </div>

                {/* 计时器区域 */}
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    ⏱️ 时间追踪
                  </div>

                  {currentTimer ? (
                    <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">当前计时</span>
                        <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                          {formatTime(elapsed)}
                        </span>
                      </div>
                      <button
                        onClick={stopTimer}
                        className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
                      >
                        停止计时
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projects.length > 0 ? (
                        <>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">选择项目开始</div>
                          <div className="max-h-[120px] overflow-y-auto space-y-1">
                            {projects.map((project) => (
                              <button
                                key={project.id}
                                onClick={() => handleProjectClick(project.id)}
                                className="w-full px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-800 dark:text-gray-200 rounded-lg text-sm transition-colors text-left flex items-center gap-2"
                              >
                                <span 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: project.color || '#3b82f6' }}
                                />
                                {project.name}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          暂无项目，请先添加
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 添加项目按钮 */}
                {!showProjectModal && !currentTimer && (
                  <button
                    onClick={() => setShowProjectModal(true)}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg text-sm transition-colors"
                  >
                    + 添加新项目
                  </button>
                )}

                {/* 添加项目表单 */}
                <AnimatePresence>
                  {showProjectModal && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="项目名称"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
                        onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateProject}
                          className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                        >
                          添加
                        </button>
                        <button
                          onClick={() => { setShowProjectModal(false); setNewProjectName(""); }}
                          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 获取吸附状态的 clip-path
function getDockedClipPath(state: BallState): string {
  switch (state) {
    case "docked-left":
      return "inset(0 0 0 80%)";
    case "docked-right":
      return "inset(0 80% 0 0)";
    case "docked-top":
      return "inset(80% 0 0 0)";
    case "docked-bottom":
      return "inset(0 0 80% 0)";
    default:
      return "";
  }
}

export default FloatingBall;
