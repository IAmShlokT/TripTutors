import { GradeBand, Subject, AchievementBadge } from '../types';

export const GRADE_BAND_LABELS: Record<GradeBand, { name: string; ageRange: string; desc: string; icon: string }> = {
  'PreK-2': {
    name: 'Pre-K to Grade 2',
    ageRange: 'Ages 4–8',
    desc: 'Counting, letters, simple word problems, phonics, and senses.',
    icon: 'Sparkles',
  },
  '3-5': {
    name: 'Grades 3 to 5',
    ageRange: 'Ages 8–11',
    desc: 'Multiplication, fractions, paragraphs, life cycles, and history.',
    icon: 'BookOpen',
  },
  '6-8': {
    name: 'Grades 6 to 8',
    ageRange: 'Ages 11–14',
    desc: 'Ratios, equations, text analysis, cell biology, and civics.',
    icon: 'Compass',
  },
  '9-12': {
    name: 'Grades 9 to 12',
    ageRange: 'Ages 14–18',
    desc: 'Algebra, physics, chemistry, essay writing, thesis & research.',
    icon: 'GraduationCap',
  },
};

export const SUBJECT_COLORS: Record<Subject, { bg: string; text: string; border: string; accent: string; badge: string }> = {
  Math: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
    accent: '#10B981',
    badge: 'bg-emerald-500 text-white',
  },
  ELA: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    accent: '#F59E0B',
    badge: 'bg-amber-500 text-white',
  },
  Science: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-800 dark:text-sky-300',
    border: 'border-sky-300 dark:border-sky-700',
    accent: '#0284C7',
    badge: 'bg-sky-500 text-white',
  },
  'Social Studies': {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
    accent: '#9333EA',
    badge: 'bg-purple-500 text-white',
  },
};

export const TOPIC_PRESETS: Record<GradeBand, Record<Subject, string[]>> = {
  'PreK-2': {
    Math: ['Counting & Number Bonds', 'Basic Addition & Subtraction', '2D & 3D Shapes', 'Simple Word Problems'],
    ELA: ['Letter Sounds & Phonics', 'Rhyming Words', 'Sight Words', 'Short Story Comprehension'],
    Science: ['Plant Life & Seeds', 'Five Senses', 'Sunny & Rainy Weather', 'Animal Homes'],
    'Social Studies': ['Community Helpers', 'Family & Friendship', 'Rules & Fairness', 'Simple Map Symbols'],
  },
  '3-5': {
    Math: ['Multiplication Tables', 'Fractions & Equivalent Fractions', 'Decimals & Money', 'Perimeter & Area'],
    ELA: ['Finding the Main Idea', 'Context Clues & Vocab', 'Writing Opinion Paragraphs', 'Parts of Speech'],
    Science: ['Photosynthesis & Food Chains', 'States of Matter', 'Solar System Basics', 'Simple Forces & Motion'],
    'Social Studies': ['State & Local History', '3 Branches of Government', 'Maps & Continents', 'Early American Pioneers'],
  },
  '6-8': {
    Math: ['Ratios & Proportions', 'Solving Linear Equations', 'Percentages & Interest', 'Pythagorean Theorem'],
    ELA: ['Analyzing Literary Themes', 'Argumentative Essays', 'Textual Evidence', 'Active vs Passive Voice'],
    Science: ['Cell Organelles & Function', 'Human Body Systems', 'Plate Tectonics & Earthquakes', 'Chemical vs Physical Changes'],
    'Social Studies': ['Ancient Egypt & Mesopotamia', 'The American Revolution', 'Global Geography', 'Basic Economic Supply & Demand'],
  },
  '9-12': {
    Math: ['Quadratic Equations & Graphs', 'Trigonometric Ratios (Sin, Cos, Tan)', 'Probability & Combinatorics', 'Intro to Derivatives'],
    ELA: ['Developing a Strong Thesis', 'Rhetorical Devices & Analysis', 'Citing MLA / APA Sources', 'Comparative Literature'],
    Science: ['DNA Replication & Genetics', 'Chemical Reactions & Stoichiometry', 'Newtonian Mechanics & Energy', 'Ecosystem Dynamics'],
    'Social Studies': ['U.S. Constitution & Landmark Cases', '20th Century World Wars', 'Macroeconomics & Fiscal Policy', 'Global Political Geography'],
  },
};

export const DEFAULT_BADGES: AchievementBadge[] = [
  { id: 'first_step', title: 'First Steps', description: 'Ask your virtual tutor your first question!', icon: 'Footprints' },
  { id: 'math_wiz', title: 'Math Explorer', description: 'Complete 3 Math practice sets', icon: 'Calculator' },
  { id: 'word_smith', title: 'Word Smith', description: 'Read a passage and answer comprehension questions', icon: 'Feather' },
  { id: 'curious_scientist', title: 'Curious Scientist', description: 'Explore a Science concept step-by-step', icon: 'Atom' },
  { id: 'history_buff', title: 'History Buff', description: 'Learn about Social Studies & Civics', icon: 'Landmark' },
  { id: 'streak_master', title: '3-Day Streak', description: 'Learn 3 days in a row with your tutor!', icon: 'Flame' },
];

export const QUICK_HELP_PROMPTS = [
  { label: '💡 Give me a hint', text: "Can you give me a subtle hint to help me figure out the next step without revealing the full answer?" },
  { label: '🧩 Explain step-by-step', text: "Let's walk through this together step-by-step! What should we look at first?" },
  { label: '🎈 Make it simpler', text: "Can you explain this again using a simpler analogy or visual example?" },
  { label: '🖼️ Draw a diagram', text: "Can you create a simple visual diagram or illustration to show me how this works?" },
  { label: '🚀 Give me a practice problem', text: "Can you give me a fun practice question on this topic so I can try it out?" },
];
