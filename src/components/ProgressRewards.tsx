import React, { useState } from 'react';
import { StudentProfile } from '../types';
import { DEFAULT_BADGES } from '../data/presetData';
import { 
  Trophy, 
  Flame, 
  Award, 
  Sparkles, 
  Heart, 
  Footprints, 
  Calculator, 
  Feather, 
  Atom, 
  Landmark, 
  CheckCircle2,
  BookOpen,
  Edit2
} from 'lucide-react';

interface ProgressRewardsProps {
  profile: StudentProfile;
  setProfile: React.Dispatch<React.SetStateAction<StudentProfile>>;
}

export const ProgressRewards: React.FC<ProgressRewardsProps> = ({ profile, setProfile }) => {
  const [reflectionStrategy, setReflectionStrategy] = useState('');
  const [reflectionMistake, setReflectionMistake] = useState('');
  const [reflections, setReflections] = useState<{ id: string; date: string; strategy: string; mistake: string }[]>(() => [
    {
      id: 'ref-1',
      date: new Date().toLocaleDateString(),
      strategy: 'Drew a visual diagram for fractions instead of rushing.',
      mistake: 'Got the denominator wrong at first, but realized I needed equal parts!',
    }
  ]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(profile.name);

  const badgeIcons: Record<string, React.ElementType> = {
    Footprints,
    Calculator,
    Feather,
    Atom,
    Landmark,
    Flame,
  };

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionStrategy.trim()) return;

    setReflections((prev) => [
      {
        id: `ref-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        strategy: reflectionStrategy,
        mistake: reflectionMistake || 'Kept trying until I figured it out!',
      },
      ...prev,
    ]);

    setReflectionStrategy('');
    setReflectionMistake('');

    // Reward points for reflecting on learning
    setProfile((prev) => ({ ...prev, points: prev.points + 25 }));
  };

  const handleUpdateName = () => {
    if (newName.trim()) {
      setProfile((prev) => ({ ...prev, name: newName }));
      setIsEditingName(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      
      {/* Student Profile Card */}
      <div className="bg-[#7A8D6E] dark:bg-[#232E1F] rounded-3xl p-6 sm:p-8 text-white shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-[#D6A378] text-white flex items-center justify-center text-3xl font-extrabold shadow-2xs border-2 border-[#F5E8DC]">
              🎓
            </div>

            <div className="space-y-1">
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    id="edit-student-name-input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-xl border border-white/30 focus:outline-none"
                  />
                  <button
                    id="btn-save-student-name"
                    onClick={handleUpdateName}
                    className="px-3 py-1 bg-[#D6A378] text-white font-bold text-xs rounded-xl"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-extrabold">{profile.name || 'Student Explorer'}</h2>
                  <button
                    id="btn-edit-student-name"
                    onClick={() => setIsEditingName(true)}
                    className="text-[#E9EDDF] hover:text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <p className="text-xs text-[#E9EDDF] font-medium">
                {profile.gradeBand} Learner • Active in {profile.subject}
              </p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center space-x-4">
            <div className="px-4 py-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-center">
              <div className="flex items-center justify-center space-x-1 text-[#F5E8DC] font-extrabold text-xl">
                <Flame className="w-5 h-5 fill-[#D6A378]" />
                <span>{profile.streakDays}</span>
              </div>
              <div className="text-[10px] text-[#E9EDDF] uppercase font-semibold mt-0.5">Day Streak</div>
            </div>

            <div className="px-4 py-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-center">
              <div className="flex items-center justify-center space-x-1 text-[#F5E8DC] font-extrabold text-xl">
                <Trophy className="w-5 h-5" />
                <span>{profile.points}</span>
              </div>
              <div className="text-[10px] text-[#E9EDDF] uppercase font-semibold mt-0.5">Total Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges & Achievements Grid */}
      <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-6 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#433D3A] dark:text-[#EFEBE5] flex items-center space-x-2">
          <Award className="w-5 h-5 text-[#7A8D6E]" />
          <span>Subject Mastery Badges</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEFAULT_BADGES.map((badge) => {
            const IconComponent = badgeIcons[badge.icon] || Award;
            const isUnlocked = profile.points >= 50; // Demo unlock threshold

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex items-start space-x-3.5 ${
                  isUnlocked
                    ? 'bg-[#E9EDDF]/50 dark:bg-[#232E1F] border-[#D0D7C5] dark:border-[#384832]'
                    : 'bg-[#FDFBF7] dark:bg-[#2B2623] border-[#EFEBE5] dark:border-[#3D3734] opacity-60'
                }`}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold shadow-2xs ${
                  isUnlocked ? 'bg-[#7A8D6E]' : 'bg-[#77716E]'
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-sm font-bold text-[#433D3A] dark:text-[#EFEBE5]">{badge.title}</h4>
                    {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-[#7A8D6E]" />}
                  </div>
                  <p className="text-xs text-[#77716E] dark:text-[#A8A29E] leading-snug">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Growth Mindset Reflection Journal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Reflection Input Form */}
        <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-6 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#433D3A] dark:text-[#EFEBE5] flex items-center space-x-2">
            <Heart className="w-5 h-5 text-[#D6A378]" />
            <span>Growth Mindset Reflection</span>
          </h3>
          <p className="text-xs text-[#77716E] dark:text-[#A8A29E]">
            Reflecting on your learning strategies and what mistakes taught you makes your brain stronger!
          </p>

          <form onSubmit={handleSaveReflection} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="reflection-strategy-input" className="text-xs font-bold text-[#433D3A] dark:text-[#EFEBE5]">
                What strategy did you use today that helped?
              </label>
              <input
                type="text"
                id="reflection-strategy-input"
                value={reflectionStrategy}
                onChange={(e) => setReflectionStrategy(e.target.value)}
                placeholder="e.g. Broke the word problem into 3 small steps, drew a chart"
                className="w-full bg-[#FDFBF7] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] text-xs p-3 rounded-2xl border border-[#EFEBE5] dark:border-[#3D3734] focus:outline-none focus:ring-2 focus:ring-[#7A8D6E]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="reflection-mistake-input" className="text-xs font-bold text-[#433D3A] dark:text-[#EFEBE5]">
                What mistake did you learn from today?
              </label>
              <input
                type="text"
                id="reflection-mistake-input"
                value={reflectionMistake}
                onChange={(e) => setReflectionMistake(e.target.value)}
                placeholder="e.g. Forgot to convert fractions first, but now I know to check!"
                className="w-full bg-[#FDFBF7] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] text-xs p-3 rounded-2xl border border-[#EFEBE5] dark:border-[#3D3734] focus:outline-none focus:ring-2 focus:ring-[#7A8D6E]"
              />
            </div>

            <button
              type="submit"
              id="btn-save-reflection"
              disabled={!reflectionStrategy.trim()}
              className="w-full py-2.5 bg-[#7A8D6E] hover:bg-[#687a5d] text-white font-bold text-xs rounded-2xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Save Reflection (+25 pts)</span>
            </button>
          </form>
        </div>

        {/* Reflection History Stream */}
        <div className="bg-white dark:bg-[#1A1817] rounded-3xl p-6 border border-[#EFEBE5] dark:border-[#2B2623] shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#433D3A] dark:text-[#EFEBE5] flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#7A8D6E]" />
            <span>Learning Journal History</span>
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {reflections.map((ref) => (
              <div key={ref.id} className="p-4 bg-[#FDFBF7] dark:bg-[#2B2623] rounded-2xl border border-[#EFEBE5] dark:border-[#3D3734] space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-[#7A8D6E] font-bold uppercase">
                  <span>Strategy & Insight</span>
                  <span>{ref.date}</span>
                </div>
                <p className="text-xs font-semibold text-[#433D3A] dark:text-[#EFEBE5]">
                  💡 <strong>Strategy:</strong> {ref.strategy}
                </p>
                <p className="text-xs text-[#77716E] dark:text-[#A8A29E]">
                  🌱 <strong>Growth:</strong> {ref.mistake}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
