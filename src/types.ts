export type GradeBand = 'PreK-2' | '3-5' | '6-8' | '9-12';

export type Subject = 'Math' | 'ELA' | 'Science' | 'Social Studies';

export type TutorMode = 'chat' | 'practice' | 'reading-writing' | 'flashcards' | 'progress';

export interface StudentProfile {
  name: string;
  gradeBand: GradeBand;
  subject: Subject;
  avatarIcon: string;
  streakDays: number;
  points: number;
  badges: string[];
  hasCreatedName?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'tutor' | 'student';
  text: string;
  timestamp: string;
  audioBase64?: string;
  imageUrl?: string;
  hints?: string[];
  suggestedFollowUps?: string[];
  isStepByStep?: boolean;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  hints: string[];
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
  showHintIndex?: number;
}

export interface PracticeSet {
  id: string;
  title: string;
  gradeBand: GradeBand;
  subject: Subject;
  topic: string;
  questions: PracticeQuestion[];
  completed?: boolean;
  score?: number;
}

export interface ReadingPassage {
  id: string;
  title: string;
  text: string;
  gradeBand: GradeBand;
  vocabulary: { word: string; definition: string }[];
  questions: {
    id: string;
    type: 'main_idea' | 'detail' | 'inference' | 'vocab';
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  subject: Subject;
  gradeBand: GradeBand;
  mastered?: boolean;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: Subject;
  gradeBand: GradeBand;
  cards: Flashcard[];
}

export interface WritingOutline {
  topic: string;
  thesisOrMainIdea: string;
  sections: {
    heading: string;
    keyPoints: string[];
  }[];
}

export interface WritingFeedback {
  strengths: string[];
  suggestions: string[];
  organizationNotes: string;
  grammarAndClarity: string;
  encouragement: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}
