import React, { useState } from 'react';
import { StudentProfile, PracticeSet, PracticeQuestion } from '../types';
import { TOPIC_PRESETS, SUBJECT_COLORS } from '../data/presetData';
import { FormattedText } from './FormattedText';
import { 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  HelpCircle, 
  RefreshCw, 
  Award, 
  ArrowRight,
  Sparkles,
  RotateCcw,
  Zap
} from 'lucide-react';

interface PracticeZoneProps {
  profile: StudentProfile;
  setProfile: React.Dispatch<React.SetStateAction<StudentProfile>>;
}

export const PracticeZone: React.FC<PracticeZoneProps> = ({ profile, setProfile }) => {
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(4);
  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const defaultTopics = TOPIC_PRESETS[profile.gradeBand]?.[profile.subject] || [];

  const handleGeneratePractice = async (selectedTopic?: string) => {
    const activeTopic = selectedTopic || topic || defaultTopics[0] || 'General Review';
    setIsLoading(true);
    setIsCompleted(false);
    setSelectedAnswers({});
    setShowHints({});
    setCurrentQuestionIndex(0);

    try {
      const res = await fetch('/api/tutor/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeBand: profile.gradeBand,
          subject: profile.subject,
          topic: activeTopic,
          count: questionCount,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate practice');

      const data = await res.json();

      setPracticeSet({
        id: `set-${Date.now()}`,
        title: data.title || `${activeTopic} Practice Set`,
        gradeBand: profile.gradeBand,
        subject: profile.subject,
        topic: activeTopic,
        questions: data.questions || [],
      });
    } catch (err) {
      console.error(err);
      alert('Could not generate practice questions right now. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionIdx: number, option: string) => {
    if (selectedAnswers[questionIdx] !== undefined) return; // Answer already selected
    
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: option,
    }));

    const currentQ = practiceSet?.questions[questionIdx];
    if (currentQ && option === currentQ.correctAnswer) {
      // Award score points
      setProfile((prev) => ({ ...prev, points: prev.points + 20 }));
    }
  };

  const handleFinishSet = () => {
    if (!practiceSet) return;
    setIsCompleted(true);

    // Calculate score
    let correctCount = 0;
    practiceSet.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) correctCount++;
    });

    // Bonus streak & badge check
    setProfile((prev) => ({
      ...prev,
      points: prev.points + correctCount * 10 + 50,
    }));
  };

  const currentQuestion: PracticeQuestion | undefined = practiceSet?.questions[currentQuestionIndex];
  const totalQuestions = practiceSet?.questions.length || 0;
  const isAnswered = selectedAnswers[currentQuestionIndex] !== undefined;
  const isCorrect = isAnswered && currentQuestion && selectedAnswers[currentQuestionIndex] === currentQuestion.correctAnswer;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      
      {/* Practice Header & Topic Selector */}
      <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-6 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#433D3A] dark:text-[#EFEBE5] flex items-center space-x-2">
              <Zap className="w-5 h-5 text-[#7A8D6E]" />
              <span>Practice & Quiz Generator</span>
            </h2>
            <p className="text-xs text-[#77716E] dark:text-[#A8A29E] mt-1">
              Custom-tailored problems for **{profile.gradeBand}** in **{profile.subject}** with instant hints & explanations.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              id="practice-question-count"
              aria-label="Number of practice questions"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="bg-[#E9EDDF] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] text-xs font-semibold py-2 px-3 rounded-xl border border-[#D0D7C5] dark:border-[#3D3734]"
            >
              <option value={3}>3 Questions</option>
              <option value={4}>4 Questions</option>
              <option value={5}>5 Questions</option>
            </select>

            <button
              id="generate-practice-btn"
              onClick={() => handleGeneratePractice()}
              disabled={isLoading}
              className="px-4 py-2 bg-[#7A8D6E] hover:bg-[#687a5d] text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>New Practice Set</span>
            </button>
          </div>
        </div>

        {/* Preset Topic Chips */}
        <div className="mt-4 pt-4 border-t border-[#EFEBE5] dark:border-[#2B2623] flex items-center space-x-2 overflow-x-auto">
          <span className="text-xs font-semibold text-[#77716E] dark:text-[#A8A29E] shrink-0">Popular Topics:</span>
          {defaultTopics.map((top) => (
            <button
              key={top}
              id={`practice-topic-${top.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => handleGeneratePractice(top)}
              disabled={isLoading}
              className="px-3 py-1 rounded-full text-xs font-medium bg-[#E9EDDF]/60 dark:bg-[#2B2623] hover:bg-[#E9EDDF] dark:hover:bg-[#3D3734] text-[#433D3A] dark:text-[#EFEBE5] border border-[#D0D7C5] dark:border-[#3D3734] transition-all whitespace-nowrap disabled:opacity-50"
            >
              {top}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-12 text-center border border-[#EFEBE5] dark:border-[#2B2623] space-y-4">
          <Sparkles className="w-10 h-10 text-[#7A8D6E] animate-spin mx-auto" />
          <h3 className="text-base font-bold text-[#433D3A] dark:text-[#EFEBE5]">
            Building your practice set...
          </h3>
          <p className="text-xs text-[#77716E] dark:text-[#A8A29E]">
            Creating age-appropriate questions with hints and step-by-step solutions!
          </p>
        </div>
      )}

      {/* Practice Active Question Container */}
      {!isLoading && practiceSet && !isCompleted && currentQuestion && (
        <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-6 sm:p-8 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs space-y-6">
          
          {/* Progress Bar & Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#58694C] dark:text-[#C3D1B9] bg-[#E9EDDF] dark:bg-[#232E1F] px-3 py-1 rounded-xl">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>

            <div className="w-48 bg-[#E9EDDF] dark:bg-[#2B2623] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#7A8D6E] h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-[#433D3A] dark:text-[#EFEBE5] leading-relaxed">
              <FormattedText text={currentQuestion.question} />
            </h3>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options?.map((option, idx) => {
              const selected = selectedAnswers[currentQuestionIndex] === option;
              const isCorrectOption = option === currentQuestion.correctAnswer;

              let optionStyle = 'bg-[#FDFBF7] dark:bg-[#2B2623] border-[#EFEBE5] dark:border-[#3D3734] hover:border-[#7A8D6E] text-[#433D3A] dark:text-[#EFEBE5]';

              if (isAnswered) {
                if (isCorrectOption) {
                  optionStyle = 'bg-[#E9EDDF] dark:bg-[#7A8D6E]/30 border-[#7A8D6E] text-[#58694C] dark:text-[#C3D1B9] font-bold';
                } else if (selected && !isCorrectOption) {
                  optionStyle = 'bg-[#F5E8DC] dark:bg-[#D6A378]/30 border-[#D6A378] text-[#A86E42] dark:text-[#E2C3AA]';
                } else {
                  optionStyle = 'opacity-50 border-[#EFEBE5] dark:border-[#2B2623] text-[#77716E]';
                }
              }

              return (
                <button
                  key={idx}
                  id={`q-${currentQuestionIndex}-opt-${idx}`}
                  onClick={() => handleSelectOption(currentQuestionIndex, option)}
                  disabled={isAnswered}
                  className={`p-4 rounded-2xl text-left text-sm border-2 transition-all flex items-start space-x-3 ${optionStyle}`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isAnswered && isCorrectOption
                      ? 'bg-[#7A8D6E] text-white'
                      : 'bg-[#E9EDDF] dark:bg-[#3D3734] text-[#7A8D6E] dark:text-[#C3D1B9]'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 mt-0.5"><FormattedText text={option} /></span>
                </button>
              );
            })}
          </div>

          {/* Hint Unlock Button */}
          {!isAnswered && (
            <div className="pt-2">
              <button
                id={`btn-toggle-hint-${currentQuestionIndex}`}
                onClick={() => setShowHints((prev) => ({ ...prev, [currentQuestionIndex]: !prev[currentQuestionIndex] }))}
                className="flex items-center space-x-1.5 text-xs font-bold text-[#D6A378] hover:underline"
              >
                <Lightbulb className="w-4 h-4" />
                <span>{showHints[currentQuestionIndex] ? 'Hide Hint' : 'Need a Hint?'}</span>
              </button>

              {showHints[currentQuestionIndex] && currentQuestion.hints?.[0] && (
                <div className="mt-2 p-3 bg-[#F5E8DC] dark:bg-[#3D2C1E] border border-[#E8D5C4] dark:border-[#523C2B] rounded-2xl text-xs text-[#A86E42] dark:text-[#E2C3AA] flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-[#D6A378] shrink-0 mt-0.5" />
                  <span><strong>Hint:</strong> <FormattedText text={currentQuestion.hints[0]} /></span>
                </div>
              )}
            </div>
          )}

          {/* Feedback & Explanation Box */}
          {isAnswered && (
            <div className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2 ${
              isCorrect 
                ? 'bg-[#E9EDDF] dark:bg-[#232E1F] border-[#D0D7C5] dark:border-[#384832] text-[#58694C] dark:text-[#C3D1B9]'
                : 'bg-[#F5E8DC] dark:bg-[#3D2C1E] border-[#E8D5C4] dark:border-[#523C2B] text-[#A86E42] dark:text-[#E2C3AA]'
            }`}>
              <div className="flex items-center space-x-2 font-bold">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#7A8D6E]" />
                    <span>Great job! That's correct! 🎉</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-[#D6A378]" />
                    <span>Nice attempt! Let's see why:</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed"><FormattedText text={currentQuestion.explanation} /></p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#EFEBE5] dark:border-[#2B2623]">
            <button
              id="btn-prev-question"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#E9EDDF] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] disabled:opacity-40"
            >
              Previous
            </button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                id="btn-next-question"
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                disabled={!isAnswered}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#7A8D6E] hover:bg-[#687a5d] text-white disabled:opacity-40 flex items-center space-x-1.5 shadow-xs"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-finish-practice-set"
                onClick={handleFinishSet}
                disabled={!isAnswered}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#7A8D6E] hover:bg-[#687a5d] text-white disabled:opacity-40 flex items-center space-x-1.5 shadow-xs"
              >
                <span>Finish Practice Set</span>
                <Award className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completion Summary Screen */}
      {!isLoading && isCompleted && practiceSet && (
        <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-8 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-[#F5E8DC] dark:bg-[#3D2C1E] text-[#D6A378] rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold">
            🏆
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-[#433D3A] dark:text-[#EFEBE5]">
              Practice Set Completed!
            </h3>
            <p className="text-sm text-[#77716E] dark:text-[#A8A29E]">
              You worked through **{practiceSet.title}**. Every mistake is proof that your brain is growing!
            </p>
          </div>

          {/* Score Box */}
          <div className="p-6 bg-[#FDFBF7] dark:bg-[#2B2623] rounded-2xl max-w-sm mx-auto border border-[#EFEBE5] dark:border-[#3D3734] flex justify-around items-center">
            <div>
              <div className="text-2xl font-bold text-[#7A8D6E]">
                {Object.keys(selectedAnswers).filter((idx) => selectedAnswers[Number(idx)] === practiceSet.questions[Number(idx)].correctAnswer).length} / {totalQuestions}
              </div>
              <div className="text-xs text-[#77716E] font-semibold mt-1">Correct Answers</div>
            </div>

            <div className="h-10 w-px bg-[#EFEBE5] dark:bg-[#3D3734]" />

            <div>
              <div className="text-2xl font-bold text-[#D6A378]">
                +100 pts
              </div>
              <div className="text-xs text-[#77716E] font-semibold mt-1">Points Earned</div>
            </div>
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            <button
              id="btn-retry-practice-set"
              onClick={() => handleGeneratePractice(practiceSet.topic)}
              className="px-6 py-2.5 rounded-xl bg-[#7A8D6E] hover:bg-[#687a5d] text-white font-bold text-xs shadow-xs flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Another Set</span>
            </button>
          </div>
        </div>
      )}

      {/* Start Banner if no practice set loaded yet */}
      {!isLoading && !practiceSet && (
        <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-10 text-center border border-[#EFEBE5] dark:border-[#2B2623] space-y-4">
          <Sparkles className="w-12 h-12 text-[#7A8D6E] mx-auto opacity-80" />
          <h3 className="text-lg font-bold text-[#433D3A] dark:text-[#EFEBE5]">
            Ready to test your skills?
          </h3>
          <p className="text-xs text-[#77716E] dark:text-[#A8A29E] max-w-md mx-auto">
            Click "New Practice Set" above or select one of the popular topics to begin practicing with step-by-step guidance!
          </p>
        </div>
      )}
    </div>
  );
};
