import { SKILL_DATA, BASE_ASSETS } from '../constants/gameData';
import {
  addUniqueToArray,
} from '../utils/achievementUtils';
import {
  getRandomMob,
  getRandomFriendlyMob,
  getRandomMiniboss,
  getRandomBoss,
  getEncounterType,
  calculateDamage,
  calculateMobHealth,
  calculateXPReward,
  calculateXPToLevel,
} from '../utils/gameUtils';
import { getRandomAura } from '../utils/mobDisplayUtils';
import {
  playFail,
  playDeath,
  playMobHurt,
  playMobDeath,
  playSuccessfulHit,
  playNotification,
  playLevelUp,
} from '../utils/soundManager';

// Extrait de App.jsx pour faire baisser la taille du fichier.
// IMPORTANT: logique conservée, on passe juste tout ce qu'il faut via ctx.
export const makeHandleSuccessHit = (ctx) => {
  const {
    battlingSkillId,
    skills,
    setSkills,
    setPlayerHealth,
    setShowDeathOverlay,
    setStats,
    checkAchievements,
    BOSS_HEALING_ANIMATION_DURATION,
    setBossHealing,
    setBattlingSkillId,
    setBattleDifficulty,
    setChallengeData,
    battleDifficulty,
    generateChallenge,
    damageIdRef,
    setDamageNumbers,
    setShowLevelRestored,
    setLootBox,
  } = ctx;

  return (skillId, isWrong) => {
    // Handle wrong answer
    if (isWrong === 'WRONG') {
      // Check if player is fighting a boss
      if (battlingSkillId) {
        const currentSkillState = skills[battlingSkillId];
        const encounterType = getEncounterType(currentSkillState.level);

        // Boss fights: heal the boss instead of damaging the player
        if (encounterType === 'boss') {
          setSkills((prev) => {
            const current = prev[battlingSkillId];
            return {
              ...prev,
              [battlingSkillId]: {
                ...current,
                mobHealth: current.mobMaxHealth, // Fully heal the boss
              },
            };
          });

          // Trigger boss healing animation
          setBossHealing(battlingSkillId);
          setTimeout(() => setBossHealing(null), BOSS_HEALING_ANIMATION_DURATION);

          // Play fail sound to indicate mistake
          playFail();
          return;
        }
      }

      // Non-boss encounters: damage player
      setPlayerHealth((h) => {
        const newH = h - 1;
        if (newH <= 0) {
          // Death sequence - play UI death sound
          playDeath();
          setShowDeathOverlay(true);

          // Track death in stats
          setStats((prevStats) => {
            const newStats = {
              ...prevStats,
              totalDeaths: (prevStats.totalDeaths || 0) + 1,
            };

            // Check achievements after death
            setTimeout(() => {
              checkAchievements(prevStats, newStats, skills, skills);
            }, 100);

            return newStats;
          });

          // Reduce player level by 1 for the active skill (minimum level 1)
          if (battlingSkillId) {
            setSkills((prev) => {
              const current = prev[battlingSkillId];
              const newLevel = Math.max(1, current.level - 1);
              const currentDiff = current.difficulty || 1;
              return {
                ...prev,
                [battlingSkillId]: {
                  ...current,
                  level: newLevel,
                  lostLevel: current.level > 1, // Only true if we actually lost a level
                  recoveryDifficulty: Math.max(1, currentDiff - 1),
                },
              };
            });
          }

          // End battle after short delay
          setTimeout(() => {
            setBattlingSkillId(null);
            setShowDeathOverlay(false);
          }, 2000);

          return 10; // Heal to full health
        }

        // Player takes damage but doesn't die - play fail sound
        playFail();
        return newH;
      });
      return;
    }

    if (!skillId) return;

    const skillConfig = SKILL_DATA.find((s) => s.id === skillId);
    const currentSkillState = skills[skillId];
    const skillDifficulty = currentSkillState.difficulty || 1;
    const playerLevel = currentSkillState.level;
    const currentMobName = currentSkillState.currentMob;

    // Calculate damage using new RPG formulas
    const damage = calculateDamage(playerLevel, skillDifficulty);

    // Get encounter type for current level
    const encounterType = getEncounterType(playerLevel);

    // Cleaning/memory/miniboss are defeated in single hit
    const isMiniboss = encounterType === 'miniboss' && skillConfig.id !== 'cleaning';
    const isInstantDefeat =
      skillConfig.id === 'cleaning' || skillConfig.id === 'memory' || isMiniboss;
    const actualDamage = isInstantDefeat ? currentSkillState.mobHealth : damage;

    // Determine if this hit will defeat the mob
    const willDefeatMob = currentSkillState.mobHealth - actualDamage <= 0;

    // Show damage numbers and play sounds
    if (skillConfig.id !== 'memory') {
      const id = ++damageIdRef.current;
      setDamageNumbers((prev) => [
        ...prev,
        {
          id,
          skillId,
          val: actualDamage,
          x: Math.random() * 100 - 50,
          y: Math.random() * 50 - 25,
        },
      ]);
      setTimeout(() => setDamageNumbers((prev) => prev.filter((n) => n.id !== id)), 800);

      // Play mob hurt or death sound based on if mob is defeated
      if (willDefeatMob) {
        playMobDeath(currentMobName);
      } else {
        playMobHurt(currentMobName);
      }

      // Play successful hit UI sound
      playSuccessfulHit();
    }

    setSkills((prev) => {
      const current = prev[skillId];
      let newMobHealth = current.mobHealth - actualDamage;
      let newLevel = current.level;
      let newXp = current.xp;
      let leveledUp = false;
      let newMob = current.currentMob;
      let newDifficulty = current.difficulty || 1;
      let newBadges = [...(current.earnedBadges || [])];
      let newMobMaxHealth = current.mobMaxHealth;
      let newLostLevel = current.lostLevel;
      let newRecoveryDifficulty = current.recoveryDifficulty;
      let newMemoryMob = current.memoryMob;
      let newPatternMob = current.patternMob;
      let newMiniboss = current.currentMiniboss;
      let newBoss = current.currentBoss;
      let newReadingMob = current.readingMob;
      let newMathMob = current.mathMob;
      let newWritingMob = current.writingMob;
      let newReadingMobAura = current.readingMobAura;
      let newMathMobAura = current.mathMobAura;
      let newWritingMobAura = current.writingMobAura;
      let newPatternMobAura = current.patternMobAura;
      let newMinibossAura = current.currentMinibossAura;
      let newBossAura = current.currentBossAura;

      // Calculate XP reward for this hit
      // Total XP is split evenly among all hits required to defeat the mob
      const totalXPReward = calculateXPReward(skillDifficulty, playerLevel);

      // For instant-defeat mobs (miniboss, cleaning, memory), actualDamage = full health, so hitsToKill = 1
      // For regular mobs, actualDamage = damage, so hitsToKill = mobMaxHealth / damage
      const effectiveDamage = isInstantDefeat ? current.mobMaxHealth : damage;
      const hitsToKill = Math.ceil(current.mobMaxHealth / effectiveDamage);
      const xpPerHit = Math.floor(totalXPReward / hitsToKill);

      // If this hit doesn't defeat the mob, award partial XP
      // If this hit defeats the mob, award any remaining XP (to account for rounding)
      const willDefeatMobInUpdate = newMobHealth <= 0;
      if (!willDefeatMobInUpdate) {
        // Award partial XP for non-killing hit
        newXp += xpPerHit;
      }

      // Mob defeated!
      if (newMobHealth <= 0) {
        // Calculate remaining XP to award (total - already awarded)
        const hitsDealt = Math.ceil((current.mobMaxHealth - current.mobHealth) / effectiveDamage);
        const xpAlreadyAwarded = hitsDealt * xpPerHit;
        const remainingXP = totalXPReward - xpAlreadyAwarded;
        newXp += remainingXP;

        // Track stats for mob defeat
        const encounterType = getEncounterType(current.level);

        setStats((prevStats) => {
          const newStats = { ...prevStats };

          // Increment battle session counter
          newStats.battlesThisSession = (newStats.battlesThisSession || 0) + 1;

          if (encounterType === 'boss') {
            // Boss defeated
            newStats.totalBossesDefeated = (newStats.totalBossesDefeated || 0) + 1;
            newStats.uniqueBossesDefeated = addUniqueToArray(
              newStats.uniqueBossesDefeated || [],
              current.currentBoss,
            );
          } else if (encounterType === 'miniboss') {
            // Miniboss defeated
            newStats.totalMinibossesDefeated = (newStats.totalMinibossesDefeated || 0) + 1;
            newStats.uniqueMinibossesDefeated = addUniqueToArray(
              newStats.uniqueMinibossesDefeated || [],
              current.currentMiniboss,
            );
          } else {
            // Regular mob defeated
            newStats.totalMobsDefeated = (newStats.totalMobsDefeated || 0) + 1;
            newStats.uniqueMobsDefeated = addUniqueToArray(
              newStats.uniqueMobsDefeated || [],
              current.currentMob,
            );
          }

          // Check achievements after stats update
          setTimeout(() => {
            checkAchievements(
              prevStats,
              newStats,
              prev,
              {
                ...prev,
                [skillId]: { ...current, level: newLevel },
              },
            );
          }, 100);

          return newStats;
        });

        // Update stable mobs for memory and patterns skills on completion
        if (skillConfig.id === 'memory') {
          newMemoryMob = getRandomFriendlyMob();
        }
        if (skillConfig.id === 'patterns') {
          newPatternMob = getRandomMob(current.currentMob);
          newPatternMobAura = getRandomAura();
        }

        // Update stable mobs for combat skills on completion
        const combatSkillMobUpdates = {
          reading: () => {
            newReadingMob = getRandomMob(current.readingMob);
            newReadingMobAura = getRandomAura();
          },
          math: () => {
            newMathMob = getRandomMob(current.mathMob);
            newMathMobAura = getRandomAura();
          },
          writing: () => {
            newWritingMob = getRandomMob(current.writingMob);
            newWritingMobAura = getRandomAura();
          },
        };

        if (combatSkillMobUpdates[skillConfig.id]) {
          combatSkillMobUpdates[skillConfig.id]();
        }

        // Update miniboss when defeating a miniboss encounter
        if (getEncounterType(current.level) === 'miniboss') {
          newMiniboss = getRandomMiniboss();
          newMinibossAura = getRandomAura();
        }

        // Update boss when defeating a boss encounter
        if (getEncounterType(current.level) === 'boss') {
          newBoss = getRandomBoss();
          newBossAura = getRandomAura();
        }

        // Check for level restoration first
        if (newLostLevel) {
          newLevel += 1;
          newLostLevel = false;
          newRecoveryDifficulty = null;
          setShowLevelRestored(true);
          setTimeout(() => setShowLevelRestored(false), 2000);
          playNotification();
        }

        // Process level ups - use difficulty-scaled XP requirement
        const xpToLevel = calculateXPToLevel(newDifficulty, newLevel);
        if (newXp >= xpToLevel) {
          const levelsGained = Math.floor(newXp / xpToLevel);
          const oldLevel = newLevel;
          newLevel += levelsGained;
          newXp = newXp % xpToLevel;
          leveledUp = true;

          // Check if we just defeated a boss (leaving a boss level)
          // Badge/difficulty increment happens when crossing FROM a boss level (e.g., 20->21)
          // not when arriving AT a boss level (e.g., 19->20)
          // Cleaning is exempt from difficulty auto-increment
          if (skillConfig.id !== 'cleaning') {
            for (let lvl = oldLevel; lvl < newLevel; lvl++) {
              if (lvl % 20 === 0 && lvl > 0) {
                // Boss at level lvl was just defeated - increment difficulty (max 7)
                const newTier = Math.floor(lvl / 20);
                if (newDifficulty < 7) {
                  newDifficulty++;
                }

                // Award badge for this tier if not already earned
                if (!newBadges.includes(newTier) && newTier <= 7) {
                  newBadges.push(newTier);

                  // Show badge notification for defeating the boss
                  setLootBox({
                    level: lvl,
                    skillName: skillConfig.fantasyName,
                    item: 'New Rank!',
                    img: BASE_ASSETS.badges.Wood,
                  });
                  playNotification();
                }
              }
            }
          }

          // Get new mob if not at boss level
          if (newLevel % 20 !== 0 && (newLevel - 1) % 20 !== 0) {
            newMob = getRandomMob(current.currentMob);
          }

          if (leveledUp) {
            playLevelUp();
          }
        }

        // Spawn new mob with fresh health
        newMobMaxHealth = calculateMobHealth(newDifficulty);
        newMobHealth = newMobMaxHealth;
        if (newLevel % 20 !== 0) {
          newMob = getRandomMob(current.currentMob);
        }
      }

      return {
        ...prev,
        [skillId]: {
          ...current,
          level: newLevel,
          xp: newXp,
          currentMob: newMob,
          difficulty: newDifficulty,
          earnedBadges: newBadges,
          mobHealth: newMobHealth,
          mobMaxHealth: newMobMaxHealth,
          lostLevel: newLostLevel,
          recoveryDifficulty: newRecoveryDifficulty,
          memoryMob: newMemoryMob,
          patternMob: newPatternMob,
          currentMiniboss: newMiniboss,
          currentBoss: newBoss,
          readingMob: newReadingMob,
          mathMob: newMathMob,
          writingMob: newWritingMob,
          readingMobAura: newReadingMobAura,
          mathMobAura: newMathMobAura,
          writingMobAura: newWritingMobAura,
          patternMobAura: newPatternMobAura,
          currentMinibossAura: newMinibossAura,
          currentBossAura: newBossAura,
        },
      };
    });

    // Generate next challenge for continuous gameplay
    if (skillConfig.hasChallenge && skillConfig.id !== 'memory') {
      // Use the stored battle difficulty for consistent challenge generation throughout the battle
      // This ensures bosses don't change difficulty mid-fight and miniboss difficulty+1 is maintained
      const challengeDiff = battleDifficulty || skillDifficulty;
      setChallengeData(generateChallenge(skillConfig.challengeType, challengeDiff));

      if (skillConfig.challengeType === 'reading') {
        // No microphone flow anymore; nothing else needed here.
      }
    } else if (skillConfig.id === 'memory') {
      setBattlingSkillId(null);
      setBattleDifficulty(null);
    }
  };
};

