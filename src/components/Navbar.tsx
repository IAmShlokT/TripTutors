import React from 'react';
import { GradeBand, Subject, TutorMode, StudentProfile } from '../types';
import { GRADE_BAND_LABELS, SUBJECT_COLORS } from '../data/presetData';
import { 
  Sparkles, 
  BookOpen, 
  Compass, 
  GraduationCap, 
  MessageSquare, 
  CheckCircle2, 
  FileText, 
  Layers, 
  Trophy, 
  Flame,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  profile: StudentProfile;
  setProfile: React.Dispatch<React.SetStateAction<StudentProfile>>;
  currentMode: TutorMode;
  setCurrentMode: (mode: TutorMode) => void;
  onEditProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  setProfile,
  currentMode,
  setCurrentMode,
  onEditProfile,
}) => {
  const safeGradeBand: GradeBand = (['PreK-2', '3-5', '6-8', '9-12'] as GradeBand[]).includes(profile.gradeBand)
    ? profile.gradeBand
    : '3-5';

  const gradeIcons = {
    'PreK-2': Sparkles,
    '3-5': BookOpen,
    '6-8': Compass,
    '9-12': GraduationCap,
  };

  const GradeIcon = gradeIcons[safeGradeBand] || Sparkles;
  const gradeLabel = GRADE_BAND_LABELS[safeGradeBand]?.name || 'Grades 3 to 5';

  return (
    <header className="bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md border-b border-emerald-100 dark:border-emerald-900/50 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Top Left: User Name, Profile Pic, and Grade */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              id="btn-top-left-profile"
              onClick={onEditProfile}
              className="flex items-center space-x-2.5 p-1.5 px-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-600/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-300 dark:border-emerald-700/60 rounded-2xl transition-all group cursor-pointer text-left shadow-2xs"
              title="Click to edit profile or change grade level"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xs text-xl border-2 border-emerald-200 dark:border-emerald-600 shrink-0">
                {profile.avatarIcon || '🎓'}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {profile.name || 'Student'}
                  </span>
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-md">
                    Edit
                  </span>
                </div>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-1 mt-0.5">
                  <GradeIcon className="w-3.5 h-3.5 inline text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[130px] sm:max-w-none">{gradeLabel}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Grade Band & Subject Selectors */}
          <div className="hidden md:flex items-center space-x-3 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            
            {/* Grade Band Dropdown */}
            <div className="relative group">
              <label htmlFor="grade-band-select" className="sr-only">Grade Band</label>
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#18181B] text-slate-800 dark:text-slate-100 text-xs font-bold shadow-2xs border border-slate-200 dark:border-slate-700 cursor-pointer">
                <GradeIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <select
                  id="grade-band-select"
                  aria-label="Grade Band"
                  value={safeGradeBand}
                  onChange={(e) => setProfile(prev => ({ ...prev, gradeBand: e.target.value as GradeBand }))}
                  className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-5 appearance-none text-slate-900 dark:text-slate-100"
                >
                  <option value="PreK-2" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-1">Pre-K–2 (Ages 4-8)</option>
                  <option value="3-5" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-1">Grades 3–5 (Ages 8-11)</option>
                  <option value="6-8" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-1">Grades 6–8 (Ages 11-14)</option>
                  <option value="9-12" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-1">Grades 9–12 (Ages 14-18)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2" />
              </div>
            </div>

            {/* Subject Selector Buttons */}
            <div className="flex items-center space-x-1">
              {(['Math', 'ELA', 'Science', 'Social Studies'] as Subject[]).map((subj) => {
                const active = profile.subject === subj;
                const colors = SUBJECT_COLORS[subj];
                return (
                  <button
                    key={subj}
                    id={`subject-btn-${subj.toLowerCase().replace(' ', '-')}`}
                    onClick={() => setProfile(prev => ({ ...prev, subject: subj }))}
                    className={`px-3.5 py-1.5 rounded-xl text-xs transition-all ${
                      active
                        ? `${colors.badge} shadow-md font-extrabold scale-[1.03]`
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 font-semibold'
                    }`}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side branding, Streak & Points */}
          <div className="flex items-center space-x-2.5">
            {/* App Branding Badge */}
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-lg">🦉</span>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Adaptive AI Tutor</span>
            </div>

            {/* Streak Counter */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-600 dark:text-amber-300 text-xs font-extrabold">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
              <span>{profile.streakDays}d Streak</span>
            </div>

            {/* Points Button */}
            <button
              id="profile-reward-badge"
              onClick={() => setCurrentMode('progress')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-400/40 rounded-2xl text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-500/20 transition-colors"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>{profile.points} pts</span>
            </button>
          </div>
        </div>

        {/* Mobile Grade & Subject Selector Bar */}
        <div className="md:hidden py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <label htmlFor="mobile-grade-select" className="sr-only">Grade Band</label>
          <select
            id="mobile-grade-select"
            aria-label="Grade Band"
            value={safeGradeBand}
            onChange={(e) => setProfile(prev => ({ ...prev, gradeBand: e.target.value as GradeBand }))}
            className="bg-slate-100 dark:bg-slate-800 text-xs font-bold py-1 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="PreK-2" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Pre-K–2</option>
            <option value="3-5" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Grades 3–5</option>
            <option value="6-8" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Grades 6–8</option>
            <option value="9-12" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Grades 9–12</option>
          </select>

          <div className="flex items-center space-x-1 overflow-x-auto">
            {(['Math', 'ELA', 'Science', 'Social Studies'] as Subject[]).map((subj) => (
              <button
                key={subj}
                id={`mobile-subj-${subj.toLowerCase().replace(' ', '-')}`}
                onClick={() => setProfile(prev => ({ ...prev, subject: subj }))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                  profile.subject === subj
                    ? SUBJECT_COLORS[subj].badge
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-2 sm:space-x-3 border-t border-slate-100 dark:border-slate-800/80 py-2 overflow-x-auto">
          {[
            { id: 'chat', label: 'Tutor Chat', icon: MessageSquare },
            { id: 'practice', label: 'Practice & Quizzes', icon: CheckCircle2 },
            { id: 'reading-writing', label: 'Reading & Writing', icon: FileText },
            { id: 'flashcards', label: 'Flashcards', icon: Layers },
            { id: 'progress', label: 'Achievements', icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = currentMode === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setCurrentMode(tab.id as TutorMode)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-emerald-600 text-white font-extrabold shadow-md scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-emerald-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
