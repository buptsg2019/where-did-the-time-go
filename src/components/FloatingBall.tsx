import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimerStore } from "../stores/timerStore";
import { useProjectStore } from "../stores/projectStore";
import { useWaterStore } from "../stores/waterStore";
import { invoke } from "@tauri-apps/api/core";

function FloatingBall() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const { currentTimer, elapsed, startTimer, stopTimer, fetchCurrentTimer, updateElapsed } = useTimerStore();
  const { projects, fetchProjects, createProject } = useProjectStore();
  const { waterLevel, fetchWaterState, drinkWater } = useWaterStore();

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // 初始化数据
  useEffect(() => {
    fetchCurrentTimer();
    fetchProjects();
    fetchWaterState();
    
    // 每分钟蒸发一次
    const evapInterval = setInterval(() => {
      handleEvaporation();
    }, 60000);
    
    return () => clearInterval(evapInterval);
  }, []);

  // 处理蒸发
  const handleEvaporation = async () => {
    if (waterLevel > 0) {
      const newLevel = await invoke<number>("evaporate_water", { amount: 0.02 });
      if (newLevel !== waterLevel) {
        fetchWaterState();
      }
    }
  };

  // 定时更新计时器
  useEffect(() => {
    if (!currentTimer) return;
    
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const start = Math.floor(new Date(currentTimer.start_time).getTime() / 1000);
      updateElapsed(now - start);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTimer]);

  // 切换展开/收缩
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setShowProjectModal(false);
  };

  const handleProjectClick = async (projectId: number) => {
    if (currentTimer) {
      await stopTimer();
    } else {
      await startTimer(projectId);
    }
    setIsExpanded(false);
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      await createProject(newProjectName.trim());
      setNewProjectName("");
      setShowProjectModal(false);
    }
  };

  const handleDrinkWater = async () => {
    await drinkWater(0.2);
  };

  // 水波动画
  const waveVariants = {
    animate: {
      x: ["-100%", "0%"],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop" as const,
          duration: 3,
          ease: "linear",
        },
      },
    },
  };

  return (
    <div className="w-full h-full flex items-start justify-start p-4 pointer-events-none">
      <motion.div
        className="pointer-events-auto relative"
        initial={false}
        animate={{
          x: isExpanded ? 0 : 0,
          y: 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* 悬浮球 - 带喝水动画 */}
        <div
          className="relative z-50"
          {...(!isExpanded ? { "data-tauri-drag-region": true } : {})}
          onClick={toggleExpand}
        >
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg cursor-pointer flex items-center justify-center overflow-hidden relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* 水波背景 */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ 
                height: `${waterLevel * 100}%`,
                opacity: 0.8,
              }}
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
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 text-white text-2xl font-bold drop-shadow-md"
            >
              {isExpanded ? "×" : "💧"}
            </motion.div>
          </motion.div>

          {/* 水位提示 */}
          <motion.div
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap"
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
              className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap border border-border pointer-events-none"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {formatTime(elapsed)}
            </motion.div>
          )}
        </div>

        {/* 展开面板 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="absolute left-24 top-0 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-4 w-[280px]"
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                {/* 喝水区域 */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">💧 记得喝水</span>
                    <span className={`text-xs font-medium ${waterLevel < 0.3 ? 'text-red-500' : 'text-blue-500'}`}>
                      {Math.round(waterLevel * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
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
                  <div className="text-sm font-semibold text-foreground mb-2">
                    ⏱️ 时间追踪
                  </div>

                  {currentTimer ? (
                    <div className="space-y-3 bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">当前计时</span>
                        <span className="text-lg font-mono font-bold text-primary">
                          {formatTime(elapsed)}
                        </span>
                      </div>
                      <button
                        onClick={stopTimer}
                        className="w-full px-3 py-2 bg-destructive hover:bg-destructive/90 text-white rounded-lg text-sm transition-colors"
                      >
                        停止计时
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projects.length > 0 ? (
                        <>
                          <div className="text-xs text-muted-foreground mb-2">选择项目开始</div>
                          <div className="max-h-[150px] overflow-y-auto space-y-1">
                            {projects.map((project) => (
                              <button
                                key={project.id}
                                onClick={() => handleProjectClick(project.id)}
                                className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-foreground rounded-lg text-sm transition-colors text-left flex items-center gap-2"
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
                        <div className="text-xs text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
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
                    className="w-full px-3 py-2 border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground rounded-lg text-sm transition-colors"
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
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateProject}
                          className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                        >
                          添加
                        </button>
                        <button
                          onClick={() => {
                            setShowProjectModal(false);
                            setNewProjectName("");
                          }}
                          className="px-3 py-2 bg-muted text-foreground rounded-lg text-sm"
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
      </motion.div>
    </div>
  );
}

export default FloatingBall;
