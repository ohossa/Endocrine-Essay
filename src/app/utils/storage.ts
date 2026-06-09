export interface QuizResult {
  id: string;
  date: string;
  chapterId: number;
  chapterTitle: string;
  subjectName: string;
  correct: number;
  total: number;
  pct: number;
  elapsedSeconds: number;
}

const HISTORY_KEY = 'endocrine_essay_quiz_history';
const MAX_RESULTS = 50;

export function saveQuizResult(result: Omit<QuizResult, 'id' | 'date'>): void {
  const history = getQuizHistory();
  const entry: QuizResult = {
    ...result,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: new Date().toISOString(),
  };
  localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...history].slice(0, MAX_RESULTS)));
}

export function getQuizHistory(): QuizResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as QuizResult[]) : [];
  } catch {
    return [];
  }
}

export function clearQuizHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
