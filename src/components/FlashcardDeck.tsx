import React, { useState } from 'react';
import { StudentProfile, FlashcardDeck as FlashcardDeckType, Flashcard } from '../types';
import { TOPIC_PRESETS } from '../data/presetData';
import { FormattedText } from './FormattedText';
import { 
  Layers, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RefreshCw, 
  RotateCcw,
  Lightbulb,
  Award
} from 'lucide-react';

interface FlashcardDeckProps {
  profile: StudentProfile;
  setProfile: React.Dispatch<React.SetStateAction<StudentProfile>>;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ profile, setProfile }) => {
  const [topic, setTopic] = useState('');
  const [deck, setDeck] = useState<FlashcardDeckType | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [cardCount, setCardCount] = useState(5);

  const defaultTopics = TOPIC_PRESETS[profile.gradeBand]?.[profile.subject] || [];

  const handleGenerateDeck = async (topicToUse?: string) => {
    const activeTopic = topicToUse || topic || defaultTopics[0] || 'Key Terms';
    setIsLoading(true);
    setIsFlipped(false);
    setShowHint(false);
    setCurrentCardIndex(0);
    setMasteredCards({});

    try {
      const res = await fetch('/api/tutor/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeBand: profile.gradeBand,
          subject: profile.subject,
          topic: activeTopic,
          count: cardCount,
        }),
      });

      if (!res.ok) throw new Error('Flashcards generation failed');

      const data = await res.json();
      setDeck({
        id: `deck-${Date.now()}`,
        title: data.title || `${activeTopic} Flashcard Deck`,
        subject: profile.subject,
        gradeBand: profile.gradeBand,
        cards: data.cards || [],
      });
    } catch (e) {
      console.error(e);
      alert('Could not generate flashcard deck right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCard = (mastered: boolean) => {
    if (!deck) return;
    const currentCard = deck.cards[currentCardIndex];
    if (!currentCard) return;

    setMasteredCards((prev) => ({
      ...prev,
      [currentCard.id || `card-${currentCardIndex}`]: mastered,
    }));

    if (mastered) {
      setProfile((prev) => ({ ...prev, points: prev.points + 15 }));
    }

    // Move to next card
    if (currentCardIndex < deck.cards.length - 1) {
      setTimeout(() => {
        setIsFlipped(false);
        setShowHint(false);
        setCurrentCardIndex((prev) => prev + 1);
      }, 200);
    }
  };

  const currentCard: Flashcard | undefined = deck?.cards[currentCardIndex];
  const totalCards = deck?.cards.length || 0;
  const masteredCount = Object.values(masteredCards).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      
      {/* Flashcard Header & Generator */}
      <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-6 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#433D3A] dark:text-[#EFEBE5] flex items-center space-x-2">
              <Layers className="w-5 h-5 text-[#7A8D6E]" />
              <span>Interactive Flashcard Deck</span>
            </h2>
            <p className="text-xs text-[#77716E] dark:text-[#A8A29E] mt-1">
              Reinforce key terms, definitions, and concepts with 3D flip card self-testing.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              id="flashcard-count-select"
              aria-label="Number of flashcards"
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="bg-[#E9EDDF] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] text-xs font-semibold py-2 px-3 rounded-xl border border-[#D0D7C5] dark:border-[#3D3734]"
            >
              <option value={4}>4 Cards</option>
              <option value={5}>5 Cards</option>
              <option value={8}>8 Cards</option>
            </select>

            <button
              id="btn-generate-flashcards"
              onClick={() => handleGenerateDeck()}
              disabled={isLoading}
              className="px-4 py-2 bg-[#7A8D6E] hover:bg-[#687a5d] text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Generate Deck</span>
            </button>
          </div>
        </div>

        {/* Topic Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-3 border-t border-[#EFEBE5] dark:border-[#2B2623]">
          <span className="text-xs font-semibold text-[#77716E] dark:text-[#A8A29E] shrink-0">Preset Topics:</span>
          {defaultTopics.map((top) => (
            <button
              key={top}
              id={`flashcard-topic-${top.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => handleGenerateDeck(top)}
              disabled={isLoading}
              className="px-3 py-1 rounded-full text-xs font-medium bg-[#E9EDDF]/60 dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] border border-[#D0D7C5] dark:border-[#3D3734] hover:border-[#7A8D6E] whitespace-nowrap disabled:opacity-50"
            >
              {top}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Screen */}
      {isLoading && (
        <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-12 text-center border border-[#EFEBE5] dark:border-[#2B2623] space-y-4">
          <Sparkles className="w-10 h-10 text-[#7A8D6E] animate-spin mx-auto" />
          <h3 className="text-base font-bold text-[#433D3A] dark:text-[#EFEBE5]">
            Creating your flashcard deck...
          </h3>
          <p className="text-xs text-[#77716E] dark:text-[#A8A29E]">Generating terms and explanations for {profile.gradeBand}!</p>
        </div>
      )}

      {/* Active Flashcard View */}
      {!isLoading && deck && currentCard && (
        <div className="space-y-6">
          
          {/* Deck Progress Bar */}
          <div className="flex items-center justify-between text-xs font-bold text-[#77716E] dark:text-[#A8A29E] px-2">
            <span>
              Card {currentCardIndex + 1} of {totalCards}
            </span>
            <span className="text-[#58694C] dark:text-[#C3D1B9]">
              Mastered: {masteredCount} / {totalCards}
            </span>
          </div>

          {/* 3D Flip Card */}
          <div
            id="interactive-flashcard"
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-80 cursor-pointer perspective-1000 group"
          >
            <div
              className={`relative w-full h-full duration-500 transition-all transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT OF CARD */}
              <div className="absolute w-full h-full rounded-3xl bg-white dark:bg-[#1A1817] border-2 border-[#D0D7C5] dark:border-[#3D3734] p-8 flex flex-col justify-between shadow-xs backface-hidden">
                <div className="flex justify-between items-center text-xs font-bold text-[#7A8D6E]">
                  <span className="uppercase tracking-wider">Question / Term</span>
                  <div className="flex items-center space-x-1 text-[#77716E]">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Click to flip</span>
                  </div>
                </div>

                <div className="text-center my-auto px-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#433D3A] dark:text-[#EFEBE5] leading-relaxed">
                    <FormattedText text={currentCard.front} />
                  </h3>
                </div>

                <div className="flex justify-between items-center pt-2">
                  {currentCard.hint ? (
                    <button
                      id="btn-flashcard-hint"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(!showHint);
                      }}
                      className="text-xs font-bold text-[#D6A378] flex items-center space-x-1"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                    </button>
                  ) : (
                    <span />
                  )}
                  <span className="text-[10px] text-[#77716E] font-semibold">FRONT</span>
                </div>

                {showHint && currentCard.hint && (
                  <div className="mt-2 p-2.5 bg-[#F5E8DC] dark:bg-[#3D2C1E] border border-[#E8D5C4] dark:border-[#523C2B] text-xs text-[#A86E42] dark:text-[#E2C3AA] rounded-2xl">
                    💡 <strong>Hint:</strong> <FormattedText text={currentCard.hint} />
                  </div>
                )}
              </div>

              {/* BACK OF CARD */}
              <div className="absolute w-full h-full rounded-3xl bg-[#7A8D6E] text-white p-8 flex flex-col justify-between shadow-xs backface-hidden rotate-y-180">
                <div className="flex justify-between items-center text-xs font-bold text-[#E9EDDF]">
                  <span className="uppercase tracking-wider">Answer / Explanation</span>
                  <div className="flex items-center space-x-1 opacity-90">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Click to flip back</span>
                  </div>
                </div>

                <div className="text-center my-auto px-4">
                  <p className="text-base sm:text-xl font-semibold leading-relaxed">
                    <FormattedText text={currentCard.back} />
                  </p>
                </div>

                <div className="text-right text-[10px] text-[#E9EDDF] font-semibold">
                  BACK
                </div>
              </div>
            </div>
          </div>

          {/* Self Assessment Controls */}
          <div className="flex items-center justify-center space-x-4 pt-2">
            <button
              id="btn-mark-card-need-review"
              onClick={() => handleMarkCard(false)}
              className="px-6 py-3 rounded-2xl bg-[#F5E8DC] dark:bg-[#3D2C1E] text-[#A86E42] dark:text-[#E2C3AA] border border-[#E8D5C4] dark:border-[#523C2B] hover:bg-[#ebd8c8] font-bold text-xs flex items-center space-x-2 transition-all shadow-xs"
            >
              <XCircle className="w-4 h-4 text-[#D6A378]" />
              <span>Need Review</span>
            </button>

            <button
              id="btn-mark-card-mastered"
              onClick={() => handleMarkCard(true)}
              className="px-6 py-3 rounded-2xl bg-[#7A8D6E] hover:bg-[#687a5d] text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Got It! (+15 pts)</span>
            </button>
          </div>

          {/* Card Navigation */}
          <div className="flex justify-between items-center text-xs text-[#77716E] pt-2 border-t border-[#EFEBE5] dark:border-[#2B2623]">
            <button
              id="btn-prev-flashcard"
              onClick={() => {
                setIsFlipped(false);
                setShowHint(false);
                setCurrentCardIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentCardIndex === 0}
              className="px-3.5 py-2 rounded-xl bg-[#E9EDDF] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] font-semibold disabled:opacity-40"
            >
              Previous Card
            </button>

            <button
              id="btn-next-flashcard"
              onClick={() => {
                setIsFlipped(false);
                setShowHint(false);
                setCurrentCardIndex((prev) => Math.min(totalCards - 1, prev + 1));
              }}
              disabled={currentCardIndex === totalCards - 1}
              className="px-3.5 py-2 rounded-xl bg-[#E9EDDF] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] font-semibold disabled:opacity-40"
            >
              Next Card
            </button>
          </div>
        </div>
      )}

      {/* Placeholder State */}
      {!isLoading && !deck && (
        <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-10 text-center border border-[#EFEBE5] dark:border-[#2B2623] space-y-3">
          <Layers className="w-10 h-10 text-[#7A8D6E] mx-auto opacity-80" />
          <h3 className="text-base font-bold text-[#433D3A] dark:text-[#EFEBE5]">
            Interactive Flashcard Deck
          </h3>
          <p className="text-xs text-[#77716E] dark:text-[#A8A29E] max-w-sm mx-auto">
            Choose a topic or click "Generate Deck" above to start testing your memory with interactive 3D flip cards!
          </p>
        </div>
      )}
    </div>
  );
};
