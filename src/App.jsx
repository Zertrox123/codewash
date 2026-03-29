import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Gift } from 'lucide-react';

// Modules
import GlobalStyles from './shared/ui/GlobalStyles';
import { getStorageKey, loadSkills, loadTheme, loadStats } from './app/profileStorage';
import { makeHandleSuccessHit } from './game/combatHandlers';
import AppChrome from './app/sections/AppChrome';
import AppDrawers from './app/sections/AppDrawers';
import AppMainCarousel from './app/sections/AppMainCarousel';
import AppToastsAndOverlays from './app/sections/AppToastsAndOverlays';
import BootSplash from './shared/ui/BootSplash';
import { createTranslator, resolveLocale } from './i18n/translations';

// Utils & Constants
import { getRandomMob, getRandomFriendlyMob, getRandomMiniboss, getRandomBoss, getMobForSkill, getEncounterType, generateMathProblem, getReadingWord, getWordForDifficulty, calculateDamage, calculateMobHealth, calculateXPReward, calculateXPToLevel } from './utils/gameUtils';
import { getRandomAura } from './utils/mobDisplayUtils';
import { 
    BASE_ASSETS, THEME_CONFIG, SKILL_DATA, 
    HOMOPHONES, DIFFICULTY_CONTENT, HOSTILE_MOBS, BOSS_MOBS, MINIBOSS_MOBS
} from './constants/gameData';
import { 
    getBGMManager, setSfxVolume, 
    playActionCardLeft, playActionCardRight, playClick, 
    playDeath, playFail, playLevelUp, playNotification, playSuccessfulHit,
    playMobHurt, playMobDeath, playAchievement
} from './utils/soundManager';
import { 
    getDefaultStats, getNewlyUnlockedAchievements, getNewTierAchievements,
    addUniqueToArray, isAchievementUnlocked
} from './utils/achievementUtils';

// Parent verification privilege constants
const PARENT_PRIVILEGE_LEVEL = 200;
const PARENT_PRIVILEGE_DIFFICULTY = 7;
const PARENT_PRIVILEGE_BADGES = [1, 2, 3, 4, 5, 6, 7, 8];

// Boss healing animation duration (ms)
const BOSS_HEALING_ANIMATION_DURATION = 600;

const App = () => {
    const [currentProfile, setCurrentProfile] = useState(() => localStorage.getItem('currentProfile_v1') ? parseInt(localStorage.getItem('currentProfile_v1')) : 1);
    const [profileNames, setProfileNames] = useState(() => localStorage.getItem('heroProfileNames_v1') ? JSON.parse(localStorage.getItem('heroProfileNames_v1')) : { 1: "Player 1", 2: "Player 2", 3: "Player 3" });
    const [parentStatus, setParentStatus] = useState(() => localStorage.getItem('heroParentStatus_v1') ? JSON.parse(localStorage.getItem('heroParentStatus_v1')) : { 1: false, 2: false, 3: false });
    const [locale, setLocale] = useState(() => resolveLocale(localStorage.getItem('codewash-locale') || navigator.language));
    const [playerHealth, setPlayerHealth] = useState(10);
    const t = useMemo(() => createTranslator(locale), [locale]);
    
    // NOTE: loadSkills/loadTheme/loadStats/getStorageKey moved to ./app/profileStorage.js
    
    const getProfileStats = (id, liveSkills = null) => {
        const initial = {};
        SKILL_DATA.forEach(skill => { initial[skill.id] = { level: 1 }; });
        
        // Use live skills if provided (for current profile with pending state changes)
        if (liveSkills) {
            let totalLevel = 0;
            let highestLevel = 0;
            Object.values(liveSkills).forEach(s => {
                if (s && typeof s.level === 'number') {
                    totalLevel += s.level;
                    if (s.level > highestLevel) highestLevel = s.level;
                }
            });
            return { totalLevel, highestLevel, skills: liveSkills, theme: activeTheme };
        }
        
        const key = getStorageKey(id);
        let saved = localStorage.getItem(key);
        if (!saved && id === 1) saved = localStorage.getItem('heroSkills_v23');
        if (!saved) return null;
        try {
            const data = JSON.parse(saved);
            const skillsData = data.skills || data;
            const theme = data.theme || 'minecraft';
            let totalLevel = 0;
            let highestLevel = 0;
            Object.values(skillsData).forEach(s => {
                if (s && typeof s.level === 'number') {
                    totalLevel += s.level;
                    if (s.level > highestLevel) highestLevel = s.level;
                }
            });
            return { totalLevel, highestLevel, skills: skillsData, theme };
        } catch (e) {
            console.warn('Failed to parse profile stats:', e);
            return null;
        }
    };

    const [skills, setSkills] = useState(() => loadSkills(currentProfile));
    const [activeTheme, setActiveTheme] = useState(() => loadTheme(currentProfile));
    const [stats, setStats] = useState(() => loadStats(currentProfile));
    const [achievementToast, setAchievementToast] = useState(null);
    const [battlingSkillId, setBattlingSkillId] = useState(null);
    const [battleDifficulty, setBattleDifficulty] = useState(null); // Track battle's starting difficulty for consistent challenge generation
    const [challengeData, setChallengeData] = useState(null);
    const [lootBox, setLootBox] = useState(null); 
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCosmeticsOpen, setIsCosmeticsOpen] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [isBugReportOpen, setIsBugReportOpen] = useState(false);
    const [damageNumbers, setDamageNumbers] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [showDeathOverlay, setShowDeathOverlay] = useState(false);
    const [showLevelRestored, setShowLevelRestored] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bossHealing, setBossHealing] = useState(null); // skillId of boss being healed
    const damageIdRef = useRef(0); // Counter for generating unique damage number IDs
    const loginTrackedRef = useRef(false); // Track if we've already recorded today's login
    const [bgmVol, setBgmVol] = useState(0.3);
    const [sfxVol, setSfxVolState] = useState(0.5);
    const bgmManager = useRef(getBGMManager());
    const [isBooting, setIsBooting] = useState(true);
    const [bootProgress, setBootProgress] = useState(0);
    const [bootMessageKey, setBootMessageKey] = useState('loading.profile');
    
    // Cosmetics state
    const [selectedBorder, setSelectedBorder] = useState(() => {
        const saved = localStorage.getItem(`borderEffect_p${currentProfile}`);
        return saved || 'solid';
    });
    const [borderColor, setBorderColor] = useState(() => {
        const saved = localStorage.getItem(`borderColor_p${currentProfile}`);
        return saved || '#FFD700';
    });

    useEffect(() => { 
        const dataToSave = { skills: skills, theme: activeTheme, stats: stats };
        localStorage.setItem(getStorageKey(currentProfile), JSON.stringify(dataToSave)); 
        localStorage.setItem('currentProfile_v1', currentProfile);
        localStorage.setItem('heroProfileNames_v1', JSON.stringify(profileNames));
        localStorage.setItem('heroParentStatus_v1', JSON.stringify(parentStatus));
    }, [skills, currentProfile, activeTheme, profileNames, parentStatus, stats]);
    
    // Save cosmetics preferences
    useEffect(() => {
        localStorage.setItem(`borderEffect_p${currentProfile}`, selectedBorder);
        localStorage.setItem(`borderColor_p${currentProfile}`, borderColor);
    }, [selectedBorder, borderColor, currentProfile]);

    useEffect(() => {
        localStorage.setItem('codewash-locale', locale);
    }, [locale]);
    
    // Calculate unlocked borders based on earned badges (memoized)
    const unlockedBorders = React.useMemo(() => {
        const unlockedBadges = new Set();
        // Tier to badge name mapping
        const tierToBadge = ['Wood', 'Stone', 'Gold', 'Iron', 'Emerald', 'Diamond', 'Netherite', 'Obsidian'];
        
        Object.values(skills).forEach(skill => {
            if (skill.earnedBadges && Array.isArray(skill.earnedBadges)) {
                skill.earnedBadges.forEach(tier => {
                    // Convert tier number to badge name (tier 1 = Wood = index 0)
                    if (tier >= 1 && tier <= 8) {
                        unlockedBadges.add(tierToBadge[tier - 1]);
                    }
                });
            }
            // Check for Star badge (level 180+) - this is awarded separately
            if (skill.level >= 180) {
                unlockedBadges.add('Star');
            }
        });
        return Array.from(unlockedBadges);
    }, [skills]);
    
    // Calculate unlocked achievements (memoized)
    const unlockedAchievements = React.useMemo(() => {
        const unlocked = [];
        const achievementIds = ['speed_demon', 'world_ender', 'monster_manual', 'perfectionist', 'full_set'];
        
        achievementIds.forEach(id => {
            if (isAchievementUnlocked(id, stats, skills)) {
                unlocked.push(id);
            }
        });
        
        return unlocked;
    }, [stats, skills]);

    // Update BGM volume
    useEffect(() => { 
        bgmManager.current.setVolume(bgmVol); 
    }, [bgmVol]);
    
    // Update SFX volume in sound manager
    useEffect(() => {
        setSfxVolume(sfxVol);
    }, [sfxVol]);
    
    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const startBGM = useCallback(() => {
        if (!bgmManager.current.isPlaying) {
            bgmManager.current.play();
        }
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.warn('Failed to enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen().catch((err) => {
                console.warn('Failed to exit fullscreen:', err);
            });
        }
        playClick();
    };

    const generateChallenge = (type, diff) => {
        if (type === 'math') return generateMathProblem(diff);
        if (type === 'patterns') return { type: 'patterns', question: 'Simon Says!', answer: 'WIN' };
        if (type === 'reading') {
            const word = getReadingWord(diff);
            return { type, question: word, answer: word };
        }
        if (type === 'writing') {
            const wordData = getWordForDifficulty(diff);
            const answer = wordData.displayName.toUpperCase();
            return { type, question: 'Spell it!', answer, images: [wordData.image], displayName: wordData.displayName };
        }
        if (type === 'memory') return { type: 'memory', question: 'Find Pairs!', answer: 'WIN' };
        return { type: 'manual', question: 'Task Complete?', answer: 'yes' };
    };

    const checkAchievements = useCallback((oldStats, newStats, oldSkills, newSkills) => {
        const newlyUnlocked = getNewlyUnlockedAchievements(oldStats, newStats, oldSkills, newSkills);
        const newTiers = getNewTierAchievements(oldStats, newStats, oldSkills, newSkills);
        if (newlyUnlocked.length > 0) {
            setAchievementToast({ achievementId: newlyUnlocked[0], tierIndex: null });
            playAchievement();
        } else if (newTiers.length > 0) {
            setAchievementToast({ achievementId: newTiers[0].achievementId, tierIndex: newTiers[0].tierIndex });
            playAchievement();
        }
    }, []);

    const handleSuccessHit = makeHandleSuccessHit({
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
    });

    const setSkillDifficulty = (skillId, newDiff) => {
        setSkills((prev) => {
            const current = prev[skillId];
            const newMobMaxHealth = calculateMobHealth(newDiff);
            return {
                ...prev,
                [skillId]: {
                    ...current,
                    difficulty: newDiff,
                    mobHealth: newMobMaxHealth,
                    mobMaxHealth: newMobMaxHealth,
                },
            };
        });
    };

    const handleThemeChange = useCallback((newTheme) => {
        if (newTheme !== activeTheme) {
            setActiveTheme(newTheme);
            setStats((prevStats) => {
                const newStats = { ...prevStats, themeChanges: (prevStats.themeChanges || 0) + 1 };
                setTimeout(() => checkAchievements(prevStats, newStats, skills, skills), 100);
                return newStats;
            });
        }
    }, [activeTheme, skills, checkAchievements]);

    const handleBorderChange = useCallback((newBorder) => {
        if (newBorder !== selectedBorder) {
            setSelectedBorder(newBorder);
            setStats((prevStats) => {
                const newStats = { ...prevStats, borderChanges: (prevStats.borderChanges || 0) + 1 };
                setTimeout(() => checkAchievements(prevStats, newStats, skills, skills), 100);
                return newStats;
            });
        }
    }, [selectedBorder, skills, checkAchievements]);

    const handlePhantomLevelAward = (skillId) => {
        if (!skillId) return;
        playLevelUp();
        setSkills((prev) => {
            const current = prev[skillId];
            return { ...prev, [skillId]: { ...current, level: current.level + 1 } };
        });
        const skillConfig = SKILL_DATA.find((s) => s.id === skillId);
        if (skillConfig) {
            setLootBox({
                level: (skills[skillId]?.level || 1) + 1,
                skillName: skillConfig.fantasyName,
                item: 'Phantom Bonus!',
                img: HOSTILE_MOBS.Phantom,
            });
            playNotification();
        }
    };

    const startBattle = (id) => {
        const skill = SKILL_DATA.find((s) => s.id === id);
        setBattlingSkillId(id);
        const currentDiff = skills[id].difficulty || 1;
        const playerLevel = skills[id].level;
        const encounterType = getEncounterType(playerLevel);
        const challengeDiff = encounterType === 'miniboss' ? Math.min(7, currentDiff + 1) : currentDiff;
        setBattleDifficulty(challengeDiff);
        setChallengeData(generateChallenge(skill.challengeType, challengeDiff));
        playClick();
        startBGM();
    };

    const endBattle = () => {
        setBattlingSkillId(null);
        setBattleDifficulty(null);
        setChallengeData(null);
        playClick();
    };

    const handleSwitchProfile = (newId) => {
        if (newId === currentProfile) return;
        playClick();
        setSkills(loadSkills(newId));
        setActiveTheme(loadTheme(newId));
        setStats(loadStats(newId));
        setCurrentProfile(newId);
    };

    const handleRenameProfile = (id, newName) => {
        setProfileNames((prev) => ({ ...prev, [id]: newName }));
    };

    const handleParentVerified = (profileId, verified) => {
        setParentStatus((prev) => ({ ...prev, [profileId]: verified }));
    };

    const handleReset = () => {
        localStorage.removeItem(getStorageKey(currentProfile));
        if (currentProfile === 1) localStorage.removeItem('heroSkills_v23');
        window.location.reload();
    };

    useEffect(() => {
        if (lootBox) setTimeout(() => setLootBox(null), 4000);
    }, [lootBox]);

    useEffect(() => {
        if (achievementToast) setTimeout(() => setAchievementToast(null), 6000);
    }, [achievementToast]);

    useEffect(() => {
        if (loginTrackedRef.current) return;
        loginTrackedRef.current = true;
        const today = new Date().toISOString().split('T')[0];
        if (!(stats.loginDates || []).includes(today)) {
            setStats((prev) => ({ ...prev, loginDates: [...(prev.loginDates || []), today] }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let cancelled = false;
        const waitFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
        const preloadImage = (src) =>
            new Promise((resolve) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = resolve;
                img.src = src;
            });

        const runBoot = async () => {
            setBootMessageKey('loading.profile');
            setBootProgress(20);
            await waitFrame();
            if (cancelled) return;

            setBootMessageKey('loading.assets');
            const currentTheme = THEME_CONFIG[activeTheme] || THEME_CONFIG.minecraft;
            const criticalAssets = [
                currentTheme?.assets?.logo,
                currentTheme?.style?.backgroundImage?.match(/url\('(.+)'\)/)?.[1],
                ...SKILL_DATA.slice(0, 4).map((skill) => skill.img),
            ].filter(Boolean);

            let loaded = 0;
            await Promise.all(
                criticalAssets.map(async (assetPath) => {
                    await preloadImage(assetPath);
                    loaded += 1;
                    if (!cancelled) {
                        const ratio = criticalAssets.length ? loaded / criticalAssets.length : 1;
                        setBootProgress(20 + ratio * 75);
                    }
                })
            );

            if (cancelled) return;
            setBootMessageKey('loading.ready');
            setBootProgress(100);
            setTimeout(() => {
                if (!cancelled) setIsBooting(false);
            }, 180);
        };

        runBoot();
        return () => {
            cancelled = true;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getVisibleItems = () => {
        const items = [];
        for (let i = -3; i <= 3; i++) {
            let idx = selectedIndex + i;
            let dataIndex = idx % SKILL_DATA.length;
            if (dataIndex < 0) dataIndex += SKILL_DATA.length;
            items.push({ ...SKILL_DATA[dataIndex], offset: i, key: idx });
        }
        return items;
    };

    const currentThemeData = THEME_CONFIG[activeTheme] || THEME_CONFIG.minecraft;
    const containerStyle = { ...currentThemeData.style, fontFamily: '"VT323", monospace' };

    const handleDragStart = (clientX) => {
        if (battlingSkillId) return;
        setIsDragging(true);
        setDragStartX(clientX);
    };

    const handleDragMove = (clientX) => {
        if (!isDragging || battlingSkillId) return;
        const diff = dragStartX - clientX;
        if (Math.abs(diff) >= 100) {
            if (diff > 0) {
                setSelectedIndex((p) => p + 1);
                playActionCardRight();
            } else {
                setSelectedIndex((p) => p - 1);
                playActionCardLeft();
            }
            setIsDragging(false);
        }
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleCardClick = (offset) => {
        if (battlingSkillId || offset === 0) return;
        setSelectedIndex((p) => p + offset);
        if (offset > 0) playActionCardRight();
        else playActionCardLeft();
    };

    const getAuraForSkill = (skillConfig, userSkill) => {
        if (skillConfig.id === 'memory' || skillConfig.id === 'cleaning') return null;
        const encounterType = getEncounterType(userSkill.level);
        if (encounterType === 'boss') return userSkill.currentBossAura;
        if (encounterType === 'miniboss') return userSkill.currentMinibossAura;
        const combatSkillAuras = {
            reading: userSkill.readingMobAura,
            math: userSkill.mathMobAura,
            writing: userSkill.writingMobAura,
            patterns: userSkill.patternMobAura,
        };
        return combatSkillAuras[skillConfig.id] || null;
    };

    if (isBooting) {
        return (
            <>
                <GlobalStyles />
                <BootSplash progress={bootProgress} message={t(bootMessageKey)} title={t('loading.title')} />
            </>
        );
    }

    return (
        <div className="min-h-screen overflow-hidden relative flex flex-col bg-cover bg-center bg-no-repeat font-sans text-stone-100" style={containerStyle}>
            <GlobalStyles />
            <div className="absolute inset-0 bg-black/30 pointer-events-none z-0"></div>

            <AppChrome
                playerHealth={playerHealth}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                isSettingsOpen={isSettingsOpen}
                setIsSettingsOpen={setIsSettingsOpen}
                isCosmeticsOpen={isCosmeticsOpen}
                setIsCosmeticsOpen={setIsCosmeticsOpen}
                setIsBugReportOpen={setIsBugReportOpen}
                isFullscreen={isFullscreen}
                toggleFullscreen={toggleFullscreen}
                battlingSkillId={battlingSkillId}
                endBattle={endBattle}
                playClick={playClick}
                locale={locale}
                setLocale={setLocale}
                t={t}
            />

            <AppDrawers
                isCosmeticsOpen={isCosmeticsOpen}
                activeTheme={activeTheme}
                handleThemeChange={handleThemeChange}
                selectedBorder={selectedBorder}
                handleBorderChange={handleBorderChange}
                borderColor={borderColor}
                setBorderColor={setBorderColor}
                unlockedBorders={unlockedBorders}
                unlockedAchievements={unlockedAchievements}

                isSettingsOpen={isSettingsOpen}
                setIsResetOpen={setIsResetOpen}
                bgmVol={bgmVol}
                setBgmVol={setBgmVol}
                sfxVol={sfxVol}
                setSfxVolState={setSfxVolState}
                currentProfile={currentProfile}
                handleSwitchProfile={handleSwitchProfile}
                profileNames={profileNames}
                handleRenameProfile={handleRenameProfile}
                getProfileStats={getProfileStats}
                parentStatus={parentStatus}
                handleParentVerified={handleParentVerified}
                skills={skills}

                isMenuOpen={isMenuOpen}
                stats={stats}

                isResetOpen={isResetOpen}
                setIsResetOpenState={setIsResetOpen}
                handleReset={handleReset}

                isBugReportOpen={isBugReportOpen}
                setIsBugReportOpenState={setIsBugReportOpen}
                locale={locale}
                setLocale={setLocale}
                t={t}
            />

            <AppMainCarousel
                currentThemeData={currentThemeData}
                battlingSkillId={battlingSkillId}
                isDragging={isDragging}
                handleDragStart={handleDragStart}
                handleDragMove={handleDragMove}
                handleDragEnd={handleDragEnd}
                handleCardClick={handleCardClick}
                setSelectedIndex={setSelectedIndex}
                playActionCardLeft={playActionCardLeft}
                playActionCardRight={playActionCardRight}
                getVisibleItems={getVisibleItems}
                skills={skills}
                getMobForSkill={getMobForSkill}
                getAuraForSkill={getAuraForSkill}
                challengeData={challengeData}
                damageNumbers={damageNumbers}
                startBattle={startBattle}
                endBattle={endBattle}
                handleSuccessHit={handleSuccessHit}
                setSkillDifficulty={setSkillDifficulty}
                selectedBorder={selectedBorder}
                borderColor={borderColor}
                bossHealing={bossHealing}
            />

            <AppToastsAndOverlays
                lootBox={lootBox}
                achievementToast={achievementToast}
                showDeathOverlay={showDeathOverlay}
                showLevelRestored={showLevelRestored}
                battlingSkillId={battlingSkillId}
                handlePhantomLevelAward={handlePhantomLevelAward}
                setStats={setStats}
                checkAchievements={checkAchievements}
                skills={skills}
            />
        </div>
    );

};

export default App;