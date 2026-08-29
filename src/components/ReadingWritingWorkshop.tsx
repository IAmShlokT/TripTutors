import React, { useState } from 'react';
import { StudentProfile, ReadingPassage, WritingOutline, WritingFeedback } from '../types';
import { TOPIC_PRESETS } from '../data/presetData';
import { FormattedText } from './FormattedText';
import { 
  BookOpen, 
  PenTool, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  HelpCircle, 
  ListOrdered, 
  FileText,
  Lightbulb,
  Heart,
  Mic,
  MicOff,
  AlertCircle
} from 'lucide-react';

interface ReadingWritingWorkshopProps {
  profile: StudentProfile;
  setProfile: React.Dispatch<React.SetStateAction<StudentProfile>>;
}

export const ReadingWritingWorkshop: React.FC<ReadingWritingWorkshopProps> = ({ profile, setProfile }) => {
  const [activeTab, setActiveTab] = useState<'reading' | 'writing'>('reading');

  // Reading state
  const [readingTopic, setReadingTopic] = useState('');
  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isReadingLoading, setIsReadingLoading] = useState(false);

  // Writing state
  const [writingTopic, setWritingTopic] = useState('');
  const [draft, setDraft] = useState('');
  const [outline, setOutline] = useState<WritingOutline | null>(null);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [isWritingLoading, setIsWritingLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  const handleSpeechDictation = async () => {
    setMicError(null);

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicError('Microphone permission was denied. Please allow microphone access in browser settings.');
          return;
        }
      }
    }

    if (!SpeechRecognition) {
      setMicError('Speech recognition is not supported in this browser. Please type directly into the box.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;

      let baseText = draft ? (draft.trim() + ' ') : '';

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        let currentDictation = '';
        for (let i = 0; i < event.results.length; i++) {
          currentDictation += event.results[i][0].transcript;
        }
        setDraft(baseText + currentDictation);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMicError('Microphone access was denied in browser permissions.');
        } else if (event.error !== 'aborted') {
          setMicError(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setMicError('Could not start microphone listening.');
    }
  };

  const defaultTopics = TOPIC_PRESETS[profile.gradeBand]?.['ELA'] || ['Space Exploration', 'Ancient Civilizations', 'Ecosystems'];

  // Generate Reading Passage
  const handleGeneratePassage = async (topicToUse?: string) => {
    const activeTopic = topicToUse || readingTopic || defaultTopics[0];
    setIsReadingLoading(true);
    setSelectedAnswers({});

    try {
      const res = await fetch('/api/tutor/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeBand: profile.gradeBand,
          topic: activeTopic,
        }),
      });

      if (!res.ok) throw new Error('Passage generation failed');

      const data = await res.json();
      setPassage({
        id: `passage-${Date.now()}`,
        title: data.title || activeTopic,
        text: data.passageText || '',
        gradeBand: profile.gradeBand,
        vocabulary: data.vocabulary || [],
        questions: data.questions || [],
      });
    } catch (e) {
      console.error(e);
      alert('Could not generate reading passage right now. Please try again!');
    } finally {
      setIsReadingLoading(false);
    }
  };

  // Generate Essay / Paragraph Outline
  const handleGenerateOutline = async () => {
    if (!writingTopic.trim()) return;
    setIsWritingLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/tutor/writing-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeBand: profile.gradeBand,
          topic: writingTopic,
          action: 'outline',
        }),
      });

      const data = await res.json();
      setOutline(data);
    } catch (e) {
      console.error(e);
      alert('Could not generate outline. Please try again!');
    } finally {
      setIsWritingLoading(false);
    }
  };

  // Analyze Writing Draft
  const handleGetFeedback = async () => {
    if (!draft.trim()) return;
    setIsWritingLoading(true);

    try {
      const res = await fetch('/api/tutor/writing-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeBand: profile.gradeBand,
          topic: writingTopic || 'General Writing',
          draft,
          action: 'feedback',
        }),
      });

      const data = await res.json();
      setFeedback(data);

      setProfile((prev) => ({ ...prev, points: prev.points + 30 }));
    } catch (e) {
      console.error(e);
      alert('Could not analyze writing draft right now.');
    } finally {
      setIsWritingLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      
      {/* Sub-Header Tabs */}
      <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-4 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            id="tab-reading-comprehension"
            onClick={() => setActiveTab('reading')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'reading'
                ? 'bg-[#7A8D6E] text-white shadow-xs'
                : 'bg-[#E9EDDF] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] hover:bg-[#E9EDDF]/80'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Reading Comprehension</span>
          </button>

          <button
            id="tab-writing-assistant"
            onClick={() => setActiveTab('writing')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'writing'
                ? 'bg-[#D6A378] text-white shadow-xs'
                : 'bg-[#E9EDDF] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] hover:bg-[#E9EDDF]/80'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Writing Workshop</span>
          </button>
        </div>

        <span className="hidden sm:inline text-xs font-semibold px-3 py-1 rounded-full bg-[#E9EDDF] dark:bg-[#2B2623] text-[#58694C] dark:text-[#C3D1B9] border border-[#D0D7C5] dark:border-[#3D3734]">
          ELA • {profile.gradeBand}
        </span>
      </div>

      {/* READING TAB CONTENT */}
      {activeTab === 'reading' && (
        <div className="space-y-6">
          {/* Passage Generator Control */}
          <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-6 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#433D3A] dark:text-[#EFEBE5] flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-[#7A8D6E]" />
                  <span>Original Grade-Level Reading Passages</span>
                </h3>
                <p className="text-xs text-[#77716E] dark:text-[#A8A29E] mt-1">
                  Read original short stories or non-fiction texts with vocabulary highlights and comprehension checks.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  id="reading-topic-input"
                  aria-label="Reading passage topic"
                  value={readingTopic}
                  onChange={(e) => setReadingTopic(e.target.value)}
                  placeholder="e.g. Rainforest Animals, Coral Reefs"
                  className="bg-[#FDFBF7] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] text-xs px-3 py-2 rounded-xl border border-[#EFEBE5] dark:border-[#3D3734] focus:outline-none focus:ring-2 focus:ring-[#7A8D6E]"
                />

                <button
                  id="btn-generate-reading-passage"
                  onClick={() => handleGeneratePassage()}
                  disabled={isReadingLoading}
                  className="px-4 py-2 bg-[#7A8D6E] hover:bg-[#687a5d] text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 shrink-0 disabled:opacity-50"
                >
                  {isReadingLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Generate Story</span>
                </button>
              </div>
            </div>

            {/* Topic Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pt-2 border-t border-[#EFEBE5] dark:border-[#2B2623]">
              <span className="text-xs font-semibold text-[#77716E] dark:text-[#A8A29E] shrink-0">Sample Topics:</span>
              {defaultTopics.map((top) => (
                <button
                  key={top}
                  id={`reading-topic-chip-${top.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => handleGeneratePassage(top)}
                  disabled={isReadingLoading}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[#E9EDDF]/60 dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] border border-[#D0D7C5] dark:border-[#3D3734] hover:border-[#7A8D6E] whitespace-nowrap disabled:opacity-50"
                >
                  {top}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Passage View */}
          {passage && !isReadingLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Passage Text & Vocab */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-6 sm:p-8 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs space-y-4">
                  <h2 className="text-xl font-bold text-[#433D3A] dark:text-[#EFEBE5] border-b border-[#EFEBE5] dark:border-[#2B2623] pb-3">
                    {passage.title}
                  </h2>

                  <div className="text-sm leading-relaxed text-[#433D3A] dark:text-[#EFEBE5] space-y-4 font-serif">
                    {passage.text.split('\n\n').map((para, idx) => (
                      <p key={idx}><FormattedText text={para} /></p>
                    ))}
                  </div>
                </div>

                {/* Vocabulary Card */}
                {passage.vocabulary.length > 0 && (
                  <div className="bg-[#F5E8DC]/60 dark:bg-[#3D2C1E]/60 rounded-3xl p-6 border border-[#E8D5C4] dark:border-[#523C2B] space-y-3">
                    <h4 className="text-xs font-bold text-[#A86E42] dark:text-[#E2C3AA] uppercase tracking-wider flex items-center space-x-1.5">
                      <Lightbulb className="w-4 h-4 text-[#D6A378]" />
                      <span>Key Vocabulary Words</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {passage.vocabulary.map((v, i) => (
                        <div key={i} className="bg-white dark:bg-[#2B2623] p-3 rounded-2xl border border-[#EFEBE5] dark:border-[#3D3734]">
                          <span className="font-bold text-xs text-[#D6A378]">{v.word}</span>
                          <p className="text-[11px] text-[#77716E] dark:text-[#A8A29E] mt-1">{v.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Comprehension Questions */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#433D3A] dark:text-[#EFEBE5] flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#7A8D6E]" />
                  <span>Comprehension Questions</span>
                </h3>

                {passage.questions.map((q, qIdx) => {
                  const selected = selectedAnswers[q.id];

                  return (
                    <div key={q.id} className="bg-white dark:bg-[#1A1817] rounded-3xl p-5 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E9EDDF] dark:bg-[#232E1F] text-[#58694C] dark:text-[#C3D1B9] uppercase">
                          {q.type.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-[#433D3A] dark:text-[#EFEBE5]">
                        {qIdx + 1}. <FormattedText text={q.question} />
                      </p>

                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selected === opt;
                          const isCorrect = opt === q.correctAnswer;

                          let btnStyle = 'bg-[#FDFBF7] dark:bg-[#2B2623] hover:border-[#7A8D6E] text-[#433D3A] dark:text-[#EFEBE5]';
                          if (selected) {
                            if (isCorrect) btnStyle = 'bg-[#E9EDDF] dark:bg-[#232E1F] border-[#7A8D6E] text-[#58694C] dark:text-[#C3D1B9] font-bold';
                            else if (isSelected && !isCorrect) btnStyle = 'bg-[#F5E8DC] dark:bg-[#3D2C1E] border-[#D6A378] text-[#A86E42] dark:text-[#E2C3AA]';
                            else btnStyle = 'opacity-50 text-[#77716E]';
                          }

                          return (
                            <button
                              key={optIdx}
                              id={`passage-q${qIdx}-opt${optIdx}`}
                              onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                              disabled={!!selected}
                              className={`w-full p-2.5 rounded-2xl text-left text-xs border border-[#EFEBE5] dark:border-[#3D3734] transition-all ${btnStyle}`}
                            >
                              <FormattedText text={opt} />
                            </button>
                          );
                        })}
                      </div>

                      {selected && (
                        <div className="p-3 bg-[#FDFBF7] dark:bg-[#2B2623] rounded-2xl text-[11px] text-[#77716E] dark:text-[#A8A29E] leading-relaxed border border-[#EFEBE5] dark:border-[#3D3734]">
                          <strong>Explanation:</strong> <FormattedText text={q.explanation} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WRITING WORKSHOP CONTENT */}
      {activeTab === 'writing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Topic & Outliner or Draft Submission */}
          <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-6 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#433D3A] dark:text-[#EFEBE5] flex items-center space-x-2">
              <PenTool className="w-5 h-5 text-[#D6A378]" />
              <span>Writing Assistant & Outliner</span>
            </h3>

            {/* Writing Topic Input */}
            <div className="space-y-1">
              <label htmlFor="writing-topic-input" className="text-xs font-bold text-[#433D3A] dark:text-[#EFEBE5]">Writing Topic or Prompt:</label>
              <input
                type="text"
                id="writing-topic-input"
                value={writingTopic}
                onChange={(e) => setWritingTopic(e.target.value)}
                placeholder="e.g. Why summer is my favorite season, How solar energy works"
                className="w-full bg-[#FDFBF7] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] text-xs p-3 rounded-2xl border border-[#EFEBE5] dark:border-[#3D3734] focus:outline-none focus:ring-2 focus:ring-[#D6A378]"
              />
            </div>

            {/* Generate Outline Button */}
            <button
              id="btn-generate-writing-outline"
              onClick={handleGenerateOutline}
              disabled={!writingTopic.trim() || isWritingLoading}
              className="w-full py-2.5 bg-[#433D3A] hover:bg-[#322C28] text-white font-bold text-xs rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-xs"
            >
              {isWritingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ListOrdered className="w-4 h-4 text-[#D6A378]" />}
              <span>Generate Essay / Paragraph Outline</span>
            </button>

            {/* Student Draft Textarea */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label htmlFor="student-writing-draft" className="text-xs font-bold text-[#433D3A] dark:text-[#EFEBE5]">
                  Your Draft / Paragraph:
                </label>
                <button
                  type="button"
                  id="writing-dictate-mic-btn"
                  onClick={handleSpeechDictation}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                    isListening
                      ? 'bg-red-500 text-white border-red-600 animate-pulse'
                      : 'bg-[#E9EDDF] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] border-[#D0D7C5] dark:border-[#3D3734] hover:bg-[#E9EDDF]/80'
                  }`}
                  title={isListening ? 'Stop dictating' : 'Dictate with your voice'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#7A8D6E]" />}
                  <span>{isListening ? 'Stop Dictating' : 'Dictate Draft'}</span>
                </button>
              </div>

              {isListening && (
                <div className="flex items-center justify-between px-3 py-1 bg-red-500/10 border border-red-300 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-300 animate-pulse">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                    <span>Dictating... Speak into your microphone!</span>
                  </div>
                </div>
              )}

              {micError && (
                <div className="flex items-center justify-between px-3 py-1 bg-amber-500/10 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{micError}</span>
                  </div>
                  <button onClick={() => setMicError(null)} className="text-[11px] underline ml-2">Dismiss</button>
                </div>
              )}

              <textarea
                id="student-writing-draft"
                rows={8}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Paste or write your paragraph or essay here (or click Dictate Draft to speak!). Your virtual tutor will give you positive feedback on clarity, organization, and grammar while keeping your voice!"
                className="w-full bg-[#FDFBF7] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] text-xs p-3 rounded-2xl border border-[#EFEBE5] dark:border-[#3D3734] focus:outline-none focus:ring-2 focus:ring-[#7A8D6E] leading-relaxed"
              />
            </div>

            <button
              id="btn-submit-writing-draft"
              onClick={handleGetFeedback}
              disabled={!draft.trim() || isWritingLoading}
              className="w-full py-3 bg-[#7A8D6E] hover:bg-[#687a5d] text-white font-bold text-xs rounded-2xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isWritingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Get Tutor Feedback</span>
            </button>
          </div>

          {/* Right Column: Generated Outline or Tutor Feedback Output */}
          <div className="space-y-6">
            
            {/* Outline Card */}
            {outline && (
              <div className="bg-[#F5E8DC]/50 dark:bg-[#3D2C1E]/40 rounded-3xl p-6 border border-[#E8D5C4] dark:border-[#523C2B] space-y-4">
                <h4 className="text-sm font-bold text-[#A86E42] dark:text-[#E2C3AA] flex items-center space-x-2">
                  <ListOrdered className="w-4 h-4 text-[#D6A378]" />
                  <span>Suggested Outline for "{outline.topic}"</span>
                </h4>

                <div className="p-3 bg-white dark:bg-[#2B2623] rounded-2xl text-xs font-bold text-[#A86E42] dark:text-[#E2C3AA] border border-[#E8D5C4] dark:border-[#3D3734]">
                  Main Thesis / Focus: <FormattedText text={outline.thesisOrMainIdea} />
                </div>

                <div className="space-y-3">
                  {outline.sections.map((sec, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#2B2623] p-4 rounded-2xl border border-[#EFEBE5] dark:border-[#3D3734] space-y-1">
                      <h5 className="text-xs font-bold text-[#433D3A] dark:text-[#EFEBE5]"><FormattedText text={sec.heading} /></h5>
                      <ul className="list-disc list-inside text-xs text-[#77716E] dark:text-[#A8A29E] space-y-0.5">
                        {sec.keyPoints.map((pt, i) => (
                          <li key={i}><FormattedText text={pt} /></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tutor Feedback Card */}
            {feedback && (
              <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-6 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs space-y-5">
                <h4 className="text-base font-bold text-[#433D3A] dark:text-[#EFEBE5] flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#7A8D6E]" />
                  <span>Virtual Tutor Writing Feedback</span>
                </h4>

                {/* Strengths */}
                <div className="p-4 bg-[#E9EDDF] dark:bg-[#232E1F] border border-[#D0D7C5] dark:border-[#384832] rounded-2xl space-y-2">
                  <h5 className="text-xs font-bold text-[#58694C] dark:text-[#C3D1B9] flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#7A8D6E]" />
                    <span>What You Did Great!</span>
                  </h5>
                  <ul className="list-disc list-inside text-xs text-[#58694C] dark:text-[#C3D1B9] space-y-1">
                    {feedback.strengths.map((str, i) => (
                      <li key={i}><FormattedText text={str} /></li>
                    ))}
                  </ul>
                </div>

                {/* Concrete Suggestions */}
                <div className="p-4 bg-[#F5E8DC] dark:bg-[#3D2C1E] border border-[#E8D5C4] dark:border-[#523C2B] rounded-2xl space-y-2">
                  <h5 className="text-xs font-bold text-[#A86E42] dark:text-[#E2C3AA] flex items-center space-x-1.5">
                    <Lightbulb className="w-4 h-4 text-[#D6A378]" />
                    <span>Suggestions to Try</span>
                  </h5>
                  <ul className="list-disc list-inside text-xs text-[#A86E42] dark:text-[#E2C3AA] space-y-1">
                    {feedback.suggestions.map((sug, i) => (
                      <li key={i}><FormattedText text={sug} /></li>
                    ))}
                  </ul>
                </div>

                {/* Grammar & Organization */}
                <div className="space-y-2 text-xs text-[#433D3A] dark:text-[#EFEBE5]">
                  <p><strong>Organization & Flow:</strong> <FormattedText text={feedback.organizationNotes} /></p>
                  <p><strong>Grammar & Clarity:</strong> <FormattedText text={feedback.grammarAndClarity} /></p>
                </div>

                {/* Encouragement */}
                <div className="p-3 bg-[#E9EDDF] dark:bg-[#2B2623] rounded-2xl text-xs text-[#58694C] dark:text-[#C3D1B9] font-semibold flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-[#7A8D6E] shrink-0" />
                  <span><FormattedText text={feedback.encouragement} /></span>
                </div>
              </div>
            )}

            {!outline && !feedback && (
              <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-10 text-center border border-[#EFEBE5] dark:border-[#2B2623] space-y-3">
                <FileText className="w-10 h-10 text-[#D6A378] mx-auto opacity-70" />
                <h4 className="text-sm font-bold text-[#433D3A] dark:text-[#EFEBE5]">Ready to write?</h4>
                <p className="text-xs text-[#77716E] dark:text-[#A8A29E]">
                  Enter a topic to generate a structured outline, or paste your paragraph draft on the left to get supportive tutor feedback!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
