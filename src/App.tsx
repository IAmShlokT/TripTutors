import React, { useState, useEffect } from 'react';
import { StudentProfile, TutorMode } from './types';
import { Navbar } from './components/Navbar';
import { TutorChat } from './components/TutorChat';
import { PracticeZone } from './components/PracticeZone';
import { ReadingWritingWorkshop } from './components/ReadingWritingWorkshop';
import { FlashcardDeck } from './components/FlashcardDeck';
import { ProgressRewards } from './components/ProgressRewards';
import { OnboardingModal } from './components/OnboardingModal';

export default function App() {
  // Load initial student profile from localStorage or fallback
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('virtual_tutor_profile');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.hasCreatedName) {
          // Reset legacy 3-day default to 1 day if requested
          if (parsed.streakDays === 3) {
            parsed.streakDays = 1;
          }
          return parsed;
        }
      } catch (e) { /* ignore */ }
    }
    return {
      name: '',
      gradeBand: '3-5',
      subject: 'Math',
      avatarIcon: '🎓',
      streakDays: 1,
      points: 150,
      badges: ['first_step', 'math_wiz'],
      hasCreatedName: false,
    };
  });

  const [currentMode, setCurrentMode] = useState<TutorMode>('chat');
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  // Save profile to localStorage on updates
  useEffect(() => {
    localStorage.setItem('virtual_tutor_profile', JSON.stringify(profile));
  }, [profile]);

  const handleCompleteProfile = (updatedProfile: Partial<StudentProfile>) => {
    setProfile(prev => ({ ...prev, ...updatedProfile, hasCreatedName: true }));
    setIsEditingProfile(false);
  };

  const showOnboarding = !profile.hasCreatedName || !profile.name.trim() || isEditingProfile;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121110] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Name Creation / Profile Setup Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        profile={profile}
        onComplete={handleCompleteProfile}
        onClose={() => setIsEditingProfile(false)}
        isEditingMode={isEditingProfile && profile.hasCreatedName}
      />

      {/* Top Navbar */}
      <Navbar
        profile={profile}
        setProfile={setProfile}
        currentMode={currentMode}
        setCurrentMode={setCurrentMode}
        onEditProfile={() => setIsEditingProfile(true)}
      />

      {/* Main Mode Canvas */}
      <main className="flex-1 py-6 px-3 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
        {currentMode === 'chat' && (
          <TutorChat profile={profile} setProfile={setProfile} />
        )}

        {currentMode === 'practice' && (
          <PracticeZone profile={profile} setProfile={setProfile} />
        )}

        {currentMode === 'reading-writing' && (
          <ReadingWritingWorkshop profile={profile} setProfile={setProfile} />
        )}

        {currentMode === 'flashcards' && (
          <FlashcardDeck profile={profile} setProfile={setProfile} />
        )}

        {currentMode === 'progress' && (
          <ProgressRewards profile={profile} setProfile={setProfile} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        <p>Adaptive AI Virtual Tutor • Pre-K to 12th Grade Math, ELA, Science, and Social Studies</p>
      </footer>
    </div>
  );
}
