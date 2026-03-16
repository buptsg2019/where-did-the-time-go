import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimerStore } from "../stores/timerStore";
import { useProjectStore } from "../stores/projectStore";
import { useWaterStore } from "../stores/waterStore";
import { invoke } from "@tauri-apps/api/core";

// 悬浮球状态
type BallState = "floating" | "expanded";

// 常量
const BALL_SIZE = 80;
const PANEL_WIDTH = 280;

function FloatingBall() {
  const [ballState, setBallState] = useState<BallState>("floating");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  
  const { currentTimer, elapsed, startTimer, stopTimer, fetchCurrentTimer, updateElapsed } = useTimerStore();
  const { projects, fetchProjects, createProject } = useProjectStore();
  const { waterLevel, fetchWaterState, drinkWater } = useWaterStore();
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化
  useEffect(() => {
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

  // 鼠标按下开始拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (ballState === "expanded") return;
    
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    };
  }, [ballState, position]);

  // 鼠标移动
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      
      // 限制在屏幕内
      const maxX = window.innerWidth - BALL_SIZE;
      const maxY = window.innerHeight - BALL_SIZE;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // 点击悬浮球
  const handleBallClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.stopPropagation();
    
    if (ballState === "expanded") {
      setBallState("floating");
      setShowProjectModal(false);
    } else {
      setBallState("expanded");
    }
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

  // 关闭面板
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBallState("floating");
    setShowProjectModal(false);
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

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-visible"
      style={{ 
        background: "transparent",
      }}
    >
      {/* 悬浮球 */}
      <motion.div
        className="absolute pointer-events-auto"
        style={{
          left: position.x,
          top: position.y,
          width: BALL_SIZE,
          height: BALL_SIZE,
          cursor: ballState === "expanded" ? "default" : isDragging ? "grabbing" : "grab",
          zIndex: 9999,
        }}
        onMouseDown={handleMouseDown}
      >
        <motion.div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg flex items-center justify-center overflow-hidden relative"
          onClick={handleBallClick}
          whileHover={ballState !== "expanded" ? { scale: 1.05 } : {}}
          whileTap={ballState !== "expanded" ? { scale: 0.95 } : {}}
          animate={{ scale: isDragging ? 1.1 : 1 }}
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
            className="relative z-10 text-white text-2xl font-bold drop-shadow-md select-none"
          >
            {ballState === "expanded" ? "×" : "💧"}
          </motion.div>
        </motion.div>

        {/* 水位提示 */}
        <motion.div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className={`font-medium ${waterLevel < 0.3 ? 'text-red-500' : 'text-blue-500'}`}>
            {Math.round(waterLevel * 100)}%
          </span>
        </motion.div>

        {/* 计时器显示 */}
        {currentTimer && (
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap border border-gray-200 dark:border-gray-700 shadow-sm pointer-events-none"
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
            className="absolute pointer-events-auto bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4"
            style={{
              left: position.x + BALL_SIZE + 10,
              top: position.y,
              width: PANEL_WIDTH,
              zIndex: 9998,
            }}
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-800 dark:text-gray-200">时间去哪了</span>
              <button
                onClick={handleClose}
                className="w-6 h-6 flex items-center justify-center text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="收起"
              >
                ×
              </button>
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
  );
}

export default FloatingBall;
