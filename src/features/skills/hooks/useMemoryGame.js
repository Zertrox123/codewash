import { useEffect, useRef, useState } from 'react';

export function useMemoryGame({
  isBattling,
  skillId,
  memoryPairs,
  FRIENDLY_MOBS,
  BASE_ASSETS,
  onMathSubmit,
}) {
  const [memoryCards, setMemoryCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);
  const [mismatchShake, setMismatchShake] = useState(false);
  const memorySessionStartedRef = useRef(false);

  useEffect(() => {
    if (isBattling && skillId === 'memory' && !memorySessionStartedRef.current) {
      memorySessionStartedRef.current = true;
      const allMobKeys = Object.keys(FRIENDLY_MOBS);
      const shuffledMobs = [...allMobKeys].sort(() => Math.random() - 0.5);
      const selectedMobs = shuffledMobs.slice(0, memoryPairs);
      const deck = [...selectedMobs, ...selectedMobs].sort(() => Math.random() - 0.5);
      setMemoryCards(deck.map((mobKey, i) => ({ id: i, color: mobKey, img: FRIENDLY_MOBS[mobKey] })));
      setFlippedIndices([]);
      setMatchedPairs([]);
      setIsProcessingMatch(false);
      setMismatchShake(false);
    } else if (!isBattling && skillId === 'memory') {
      memorySessionStartedRef.current = false;
      setMemoryCards([]);
      setFlippedIndices([]);
      setMatchedPairs([]);
      setIsProcessingMatch(false);
      setMismatchShake(false);
    }
  }, [isBattling, skillId, memoryPairs, FRIENDLY_MOBS]);

  const handleCardClick = (index) => {
    if (
      isProcessingMatch ||
      flippedIndices.includes(index) ||
      matchedPairs.includes(memoryCards[index].color)
    ) {
      return;
    }
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessingMatch(true);
      const [first, second] = newFlipped;

      if (memoryCards[first].color === memoryCards[second].color) {
        setTimeout(() => {
          const matchAudio = new Audio(BASE_ASSETS.audio.match);
          matchAudio.play();
          const newMatched = [...matchedPairs, memoryCards[newFlipped[0]].color];
          setMatchedPairs(newMatched);
          setFlippedIndices([]);
          setIsProcessingMatch(false);
          if (newMatched.length === memoryPairs) onMathSubmit('WIN');
        }, 500);
      } else {
        setTimeout(() => {
          const mismatchAudio = new Audio(BASE_ASSETS.audio.mismatch);
          mismatchAudio.play();
          setMismatchShake(true);
          setTimeout(() => setMismatchShake(false), 400);
          setFlippedIndices([]);
          setIsProcessingMatch(false);
        }, 800);
      }
    }
  };

  return {
    memoryCards,
    flippedIndices,
    matchedPairs,
    mismatchShake,
    handleCardClick,
  };
}

