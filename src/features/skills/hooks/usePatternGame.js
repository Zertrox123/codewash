import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DIFFICULTY_CONTENT } from '../../../constants/gameData';
import { getSfxVolume, playClick } from '../../../utils/soundManager';

const MAX_TEMPO_DELAY = 800;
const MIN_TEMPO_DELAY = 200;

const AXOLOTL_NOTE_MAP = {
  Pink: 'c4',
  Cyan: 'd4',
  Gold: 'e4',
  Brown: 'f4',
  Blue: 'g4',
  Red: 'a4',
  Green: 'b4',
  Black: 'g5',
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (start, end, t) => start + (end - start) * clamp(t, 0, 1);

const getTempoDelays = (completedRounds, currentDifficulty) => {
  const round = completedRounds + 1;
  const startingDelay = lerp(MAX_TEMPO_DELAY, MIN_TEMPO_DELAY, (currentDifficulty - 1) / 6);
  const maxRunwayRounds = lerp(10, 1, (currentDifficulty - 1) / 6);
  const runwayProgress = maxRunwayRounds > 1 ? (round - 1) / (maxRunwayRounds - 1) : 1;
  const rawOnDelay = lerp(startingDelay, MIN_TEMPO_DELAY, runwayProgress);
  const onDelay = clamp(rawOnDelay, MIN_TEMPO_DELAY, MAX_TEMPO_DELAY);
  const offDelay = Math.max(100, Math.round(onDelay * 0.35));
  return { onDelay, offDelay };
};

export function usePatternGame({
  isBattling,
  skillId,
  difficulty,
  BASE_ASSETS,
  onMathSubmit,
}) {
  const [simonSequence, setSimonSequence] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [litAxolotl, setLitAxolotl] = useState(null);
  const [simonGameActive, setSimonGameActive] = useState(false);
  const simonSessionStartedRef = useRef(false);

  const patternConfig = DIFFICULTY_CONTENT.patterns[difficulty] || DIFFICULTY_CONTENT.patterns[1];
  const axolotlCount = patternConfig.axolotlCount || 2;
  const shouldResetSequence = patternConfig.resetSequence || false;

  const axolotlColors = useMemo(() => {
    const allAxolotlColors = Object.keys(BASE_ASSETS.axolotls);
    return allAxolotlColors.slice(0, Math.min(axolotlCount, allAxolotlColors.length));
  }, [axolotlCount, BASE_ASSETS.axolotls]);

  const playAxolotlNote = useCallback((color) => {
    const noteName = AXOLOTL_NOTE_MAP[color];
    if (noteName) {
      const audio = new Audio(`assets/sounds/axolotl/${noteName}.wav`);
      audio.volume = getSfxVolume();
      audio.play().catch(() => {
        playClick();
      });
    } else {
      playClick();
    }
  }, []);

  const playSequence = useCallback((sequence) => {
    setIsShowingSequence(true);
    setPlayerIndex(0);
    let i = 0;
    const { onDelay, offDelay } = getTempoDelays(completedRounds, difficulty);

    const playNext = () => {
      if (i < sequence.length) {
        setLitAxolotl(sequence[i]);
        playAxolotlNote(sequence[i]);
        setTimeout(() => {
          setLitAxolotl(null);
          i++;
          setTimeout(playNext, offDelay);
        }, onDelay);
      } else {
        setIsShowingSequence(false);
      }
    };
    setTimeout(playNext, 500);
  }, [completedRounds, difficulty, playAxolotlNote]);

  const startSimonGame = useCallback(() => {
    const firstColor = axolotlColors[Math.floor(Math.random() * axolotlColors.length)];
    const newSequence = [firstColor];
    setSimonSequence(newSequence);
    setPlayerIndex(0);
    setCompletedRounds(0);
    setSimonGameActive(true);
    playSequence(newSequence);
  }, [axolotlColors, playSequence]);

  const handleAxolotlClick = (color) => {
    if (!simonGameActive || isShowingSequence) return;
    playAxolotlNote(color);
    if (color === simonSequence[playerIndex]) {
      const nextIndex = playerIndex + 1;
      if (nextIndex === simonSequence.length) {
        const matchAudio = new Audio(BASE_ASSETS.audio.match);
        matchAudio.volume = getSfxVolume();
        matchAudio.play().catch(() => {});
        const newRounds = completedRounds + 1;
        setCompletedRounds(newRounds);
        const damage = Math.round(newRounds * 1.5);
        onMathSubmit(damage.toString());
        if (newRounds >= 5) {
          setSimonGameActive(false);
          onMathSubmit('WIN');
        } else {
          let nextSequence;
          if (shouldResetSequence) {
            const nextColor = axolotlColors[Math.floor(Math.random() * axolotlColors.length)];
            nextSequence = [nextColor];
          } else {
            const nextColor = axolotlColors[Math.floor(Math.random() * axolotlColors.length)];
            nextSequence = [...simonSequence, nextColor];
          }
          setSimonSequence(nextSequence);
          setTimeout(() => playSequence(nextSequence), 500);
        }
      } else {
        setPlayerIndex(nextIndex);
      }
    } else {
      const mismatchAudio = new Audio(BASE_ASSETS.audio.mismatch);
      mismatchAudio.volume = getSfxVolume();
      mismatchAudio.play().catch(() => {});
      onMathSubmit('WRONG');
      setSimonGameActive(false);
      setTimeout(() => startSimonGame(), 1000);
    }
  };

  useEffect(() => {
    if (isBattling && skillId === 'patterns' && !simonSessionStartedRef.current) {
      simonSessionStartedRef.current = true;
      startSimonGame();
    } else if (!isBattling && skillId === 'patterns') {
      simonSessionStartedRef.current = false;
      setSimonSequence([]);
      setPlayerIndex(0);
      setIsShowingSequence(false);
      setCompletedRounds(0);
      setLitAxolotl(null);
      setSimonGameActive(false);
    }
  }, [isBattling, skillId, startSimonGame]);

  return {
    axolotlColors,
    completedRounds,
    litAxolotl,
    isShowingSequence,
    simonGameActive,
    handleAxolotlClick,
  };
}

