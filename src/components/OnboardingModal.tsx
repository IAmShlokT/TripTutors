import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentProfile, GradeBand, Subject } from '../types';
import { GRADE_BAND_LABELS } from '../data/presetData';
import { Sparkles, User, GraduationCap, Compass, BookOpen, Check, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  profile: StudentProfile;
  onComplete: (updatedProfile: Partial<StudentProfile>) => void;
  onClose?: () => void;
  isEditingMode?: boolean;
}

const AVATAR_OPTIONS = ['🎓', '🦉', '🚀', '🎨', '🔬', '🦊', '🦁', '🌟', '⚡', '🦄'];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  profile,
  onComplete,
  onClose,
  isEditingMode = false,
}) => {
  const [name, setName] = useState(profile.name === 'Alex' && !profile.hasCreatedName ? '' : profile.name);
  const [avatarIcon, setAvatarIcon] = useState(profile.avatarIcon || '🎓');
  const [gradeBand, setGradeBand] = useState<GradeBand>(profile.gradeBand || '3-5');
  const [subject, setSubject] = useState<Subject>(profile.subject || 'Math');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name to start learning!');
      return;
    }
    setError('');
    onComplete({
      name: trimmed,
      avatarIcon,
      gradeBand,
      subject,
      hasCreatedName: true,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1E1B1A] rounded-3xl shadow-2xl border-2 border-emerald-400 dark:border-emerald-600 overflow-hidden my-8"
        >
          {/* Top Decorative Banner */}
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-6 -top-6 w-32 h-32 bg-amber-300/20 rounded-full blur-xl pointer-events-none" />
            
            <div className="inline-flex items-center justify-center p-3 bg-white/20 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
              <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight">
              {isEditingMode ? 'Update Your Student Profile' : 'Welcome to Your AI Tutor! 🌟'}
            </h2>
            <p className="text-xs text-emerald-100 font-medium mt-1 max-w-sm mx-auto">
              {isEditingMode
                ? 'Customize your grade, name, and favorite subject anytime.'
                : 'First, let’s create your student profile to personalize your adaptive learning experience!'}
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Step 1: Student Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="student-name-input" className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>What is your name? <span className="text-red-500">*</span></span>
              </label>
              <input
                id="student-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your first name (e.g., Maya, Sam, Jordan)..."
                autoFocus
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2B2623] text-slate-900 dark:text-white text-sm font-semibold rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none transition-all"
              />
              {error && (
                <p className="text-xs font-bold text-red-500 mt-1 animate-bounce">
                  ⚠️ {error}
                </p>
              )}
            </div>

            {/* Step 2: Choose Avatar Icon */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Pick Your Avatar Emoji:
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setAvatarIcon(icon)}
                    className={`h-11 rounded-2xl text-xl flex items-center justify-center transition-all ${
                      avatarIcon === icon
                        ? 'bg-emerald-500 text-white shadow-md scale-110 border-2 border-emerald-300'
                        : 'bg-slate-100 dark:bg-[#2B2623] hover:bg-emerald-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Grade Band Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>Select Your Grade Level:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['PreK-2', '3-5', '6-8', '9-12'] as GradeBand[]).map((gb) => {
                  const isSelected = gradeBand === gb;
                  const label = GRADE_BAND_LABELS[gb];
                  return (
                    <button
                      key={gb}
                      type="button"
                      onClick={() => setGradeBand(gb)}
                      className={`p-3 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                          : 'bg-slate-50 dark:bg-[#2B2623] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{label.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {label.ageRange}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Starting Subject */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Favorite Starting Subject:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Math', 'ELA', 'Science', 'Social Studies'] as Subject[]).map((subj) => {
                  const isSelected = subject === subj;
                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSubject(subj)}
                      className={`px-3 py-2.5 rounded-2xl text-xs font-bold border-2 transition-all text-center ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#2B2623] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                      }`}
                    >
                      {subj}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center space-x-3">
              {isEditingMode && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#2B2623] text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                id="btn-complete-onboarding"
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>{isEditingMode ? 'Save Profile Changes' : 'Start Learning Now! 🎉'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
