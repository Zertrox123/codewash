import { getDefaultStats } from '../utils/achievementUtils';
import {
  getRandomMob,
  getRandomFriendlyMob,
  getRandomMiniboss,
  getRandomBoss,
  calculateMobHealth,
} from '../utils/gameUtils';
import { getRandomAura } from '../utils/mobDisplayUtils';
import { SKILL_DATA } from '../constants/gameData';

export const getStorageKey = (profileId) => `heroSkills_v23_p${profileId}`;

export const loadSkills = (profileId) => {
  const initial = {};

  // Initialize each skill with level, xp, currentMob, difficulty (1-7),
  // earnedBadges array, mobHealth for HP-based combat, and death/recovery state
  SKILL_DATA.forEach((skill) => {
    const initialDifficulty = 1;
    initial[skill.id] = {
      level: 1,
      xp: 0,
      currentMob: getRandomMob(null),
      difficulty: initialDifficulty, // Per-skill difficulty (1-7)
      earnedBadges: [], // Array of earned badge tier numbers (1-7)
      mobHealth: calculateMobHealth(initialDifficulty), // Mob's current HP
      mobMaxHealth: calculateMobHealth(initialDifficulty), // Mob's max HP
      lostLevel: false, // True if player died and lost a level
      recoveryDifficulty: null, // Difficulty to suggest for recovery
      memoryMob: skill.id === 'memory' ? getRandomFriendlyMob() : null, // Stable mob for Memory card display
      patternMob: skill.id === 'patterns' ? getRandomMob(null) : null, // Stable hostile mob for Patterns card display
      currentMiniboss: getRandomMiniboss(), // Stable miniboss for miniboss encounters
      currentBoss: getRandomBoss(), // Stable boss for boss encounters
      readingMob: skill.id === 'reading' ? getRandomMob(null) : null, // Stable mob for Reading card display
      mathMob: skill.id === 'math' ? getRandomMob(null) : null, // Stable mob for Math card display
      writingMob: skill.id === 'writing' ? getRandomMob(null) : null, // Stable mob for Writing card display

      // Auras for each mob type
      readingMobAura: skill.id === 'reading' ? getRandomAura() : null,
      mathMobAura: skill.id === 'math' ? getRandomAura() : null,
      writingMobAura: skill.id === 'writing' ? getRandomAura() : null,
      patternMobAura: skill.id === 'patterns' ? getRandomAura() : null,
      currentMinibossAura: getRandomAura(), // Aura for miniboss encounters
      currentBossAura: getRandomAura(), // Aura for boss encounters
    };
  });

  let saved = localStorage.getItem(getStorageKey(profileId));
  if (!saved && profileId === 1) saved = localStorage.getItem('heroSkills_v23');

  try {
    if (saved) {
      const parsed = JSON.parse(saved);
      const data = parsed.skills || parsed;

      Object.keys(data).forEach((key) => {
        initial[key] = { ...initial[key], ...data[key] };

        // Ensure difficulty exists (backward compatibility)
        if (typeof initial[key].difficulty !== 'number') {
          initial[key].difficulty = 1;
        }

        // Ensure earnedBadges array exists (backward compatibility)
        if (!Array.isArray(initial[key].earnedBadges)) {
          initial[key].earnedBadges = [];
        }

        // Ensure mobHealth exists (backward compatibility)
        if (typeof initial[key].mobHealth !== 'number') {
          const diff = initial[key].difficulty || 1;
          initial[key].mobHealth = calculateMobHealth(diff);
          initial[key].mobMaxHealth = calculateMobHealth(diff);
        }

        // Ensure death/recovery state exists
        if (typeof initial[key].lostLevel !== 'boolean') {
          initial[key].lostLevel = false;
        }

        if (initial[key].recoveryDifficulty === undefined) {
          initial[key].recoveryDifficulty = null;
        }

        // Ensure memoryMob exists for memory skill (backward compatibility)
        if (key === 'memory' && !initial[key].memoryMob) {
          initial[key].memoryMob = getRandomFriendlyMob();
        }

        // Ensure patternMob exists for patterns skill (backward compatibility)
        if (key === 'patterns' && !initial[key].patternMob) {
          initial[key].patternMob = getRandomMob(null);
        }

        // Ensure combat skill mobs exist (backward compatibility)
        if (key === 'reading' && !initial[key].readingMob) {
          initial[key].readingMob = getRandomMob(null);
        }
        if (key === 'math' && !initial[key].mathMob) {
          initial[key].mathMob = getRandomMob(null);
        }
        if (key === 'writing' && !initial[key].writingMob) {
          initial[key].writingMob = getRandomMob(null);
        }

        // Ensure auras exist for combat skill mobs (backward compatibility)
        if (key === 'reading' && !initial[key].readingMobAura) {
          initial[key].readingMobAura = getRandomAura();
        }
        if (key === 'math' && !initial[key].mathMobAura) {
          initial[key].mathMobAura = getRandomAura();
        }
        if (key === 'writing' && !initial[key].writingMobAura) {
          initial[key].writingMobAura = getRandomAura();
        }
        if (key === 'patterns' && !initial[key].patternMobAura) {
          initial[key].patternMobAura = getRandomAura();
        }

        // Ensure miniboss and boss mobs exist for combat skills (backward compatibility)
        // Only initialize for skills that use the encounter type system (not cleaning or memory)
        if (key !== 'cleaning' && key !== 'memory') {
          if (!initial[key].currentMiniboss) {
            initial[key].currentMiniboss = getRandomMiniboss();
          }
          if (!initial[key].currentBoss) {
            initial[key].currentBoss = getRandomBoss();
          }
          if (!initial[key].currentMinibossAura) {
            initial[key].currentMinibossAura = getRandomAura();
          }
          if (!initial[key].currentBossAura) {
            initial[key].currentBossAura = getRandomAura();
          }
        }
      });

      return initial;
    }
  } catch (e) {
    console.warn('Failed to parse saved skills:', e);
  }

  return initial;
};

export const loadTheme = (profileId) => {
  let saved = localStorage.getItem(getStorageKey(profileId));
  if (!saved && profileId === 1) {
    saved = localStorage.getItem('heroSkills_v23');
  }

  try {
    return JSON.parse(saved).theme || 'minecraft';
  } catch (e) {
    console.warn('Failed to parse theme:', e);
  }

  return 'minecraft';
};

export const loadStats = (profileId) => {
  let saved = localStorage.getItem(getStorageKey(profileId));
  if (!saved && profileId === 1) {
    saved = localStorage.getItem('heroSkills_v23');
  }

  try {
    const data = JSON.parse(saved);
    if (data.stats) {
      // Merge with default stats to ensure all fields exist
      return { ...getDefaultStats(), ...data.stats };
    }
  } catch (e) {
    console.warn('Failed to parse stats:', e);
  }

  return getDefaultStats();
};

