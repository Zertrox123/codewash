import React from 'react';
import SafeImage from '../../shared/ui/SafeImage';
import AchievementToast from '../../shared/ui/AchievementToast';
import PhantomEvent from '../../components/PhantomEvent';
import { Gift } from 'lucide-react';

const AppToastsAndOverlays = ({
  lootBox,
  achievementToast,
  showDeathOverlay,
  showLevelRestored,

  battlingSkillId,
  handlePhantomLevelAward,
  setStats,
  checkAchievements,
  skills,
}) => {
  return (
    <>
      {lootBox && (
        <div className="fixed bottom-8 left-1/2 z-50 animate-toast w-full max-w-2xl pointer-events-none transform -translate-x-1/2">
          <div className="bg-black/80 border-4 border-yellow-500 rounded-full p-4 px-12 flex items-center justify-between shadow-[0_0_30px_rgba(255,215,0,0.6)] backdrop-blur-md mx-4">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500/20 p-3 rounded-full border-2 border-yellow-400">
                <Gift size={32} className="text-yellow-300 animate-bounce" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl text-yellow-400 font-bold leading-none mb-1">
                  LEVEL {lootBox.level} REACHED!
                </h2>
                <p className="text-stone-300 text-sm">{lootBox.skillName}</p>
              </div>
            </div>
            <div className="text-right pl-8 border-l-2 border-stone-600 flex items-center gap-4">
              <SafeImage src={lootBox.img} alt="Badge" className="w-12 h-12 object-contain" />
              <div>
                <p className="text-stone-400 text-xs uppercase tracking-wider">Unlocked</p>
                <p className="text-2xl text-green-400 font-bold">{lootBox.item}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Toast */}
      {achievementToast && (
        <AchievementToast
          achievementId={achievementToast.achievementId}
          tierIndex={achievementToast.tierIndex}
        />
      )}

      {/* Death Overlay - Minecraft-style YOU DIED screen */}
      {showDeathOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-900/60 animate-pulse pointer-events-none">
          <div className="text-center">
            <h1
              className="text-8xl font-bold text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]"
              style={{ textShadow: '4px 4px 0 #000, -2px -2px 0 #000' }}
            >
              YOU DIED
            </h1>
            <p className="text-2xl text-red-300 mt-4">Level -1</p>
            <p className="text-lg text-stone-400 mt-2">Take a moment to rest...</p>
          </div>
        </div>
      )}

      {/* Level Restored celebration */}
      {showLevelRestored && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="text-center animate-bounce">
            <h1
              className="text-6xl font-bold text-green-400 drop-shadow-[0_0_20px_rgba(0,255,0,0.8)]"
              style={{ textShadow: '4px 4px 0 #000' }}
            >
              LEVEL RESTORED!
            </h1>
            <p className="text-2xl text-yellow-400 mt-4">Welcome back, hero!</p>
          </div>
        </div>
      )}

      {/* Phantom Fly-By Bonus Event */}
      <PhantomEvent
        battlingSkillId={battlingSkillId}
        onAwardLevel={handlePhantomLevelAward}
        onPhantomCaught={() => {
          setStats((prevStats) => {
            const newStats = {
              ...prevStats,
              phantomsCaught: (prevStats.phantomsCaught || 0) + 1,
            };

            // Check achievements
            setTimeout(() => {
              checkAchievements(prevStats, newStats, skills, skills);
            }, 100);

            return newStats;
          });
        }}
      />
    </>
  );
};

export default AppToastsAndOverlays;

