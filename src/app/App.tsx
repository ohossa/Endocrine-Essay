import { useState } from 'react';
import { ChapterData, SubjectData, Question, Screen } from './types';
import { ChapterSelect } from './components/ChapterSelect';
import { SubjectSelect } from './components/SubjectSelect';
import { QuizInterface } from './components/QuizInterface';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ThemeProvider } from './context/ThemeContext';
import { saveQuizResult } from './utils/storage';

interface QuizPayload {
  chapter: ChapterData;
  subject: SubjectData | null;
  questions: Question[];
}

interface ResultPayload {
  chapter: ChapterData;
  subject: SubjectData | null;
  questions: Question[];
  answers: Record<number, any>;
  elapsedSeconds: number;
  flaggedQuestions: Set<number>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<ChapterData | null>(null);
  const [quizPayload, setQuizPayload] = useState<QuizPayload | null>(null);
  const [resultPayload, setResultPayload] = useState<ResultPayload | null>(null);

  const transitionTo = (fn: () => void) => {
    // @ts-ignore
    if (document.startViewTransition) {
      // @ts-ignore
      document.startViewTransition(fn);
    } else {
      fn();
    }
  };

  const handleSelectChapter = (chapter: ChapterData) => {
    transitionTo(() => {
      setSelectedChapter(chapter);
      setScreen('subjects');
    });
  };

  const handleSelectSubject = (subject: SubjectData, questions: Question[]) => {
    transitionTo(() => {
      setQuizPayload({ chapter: selectedChapter!, subject, questions });
      setScreen('quiz');
    });
  };

  const handleQuickStart = (questions: Question[]) => {
    transitionTo(() => {
      setQuizPayload({ chapter: selectedChapter!, subject: null, questions });
      setScreen('quiz');
    });
  };

  const checkAnswerCorrect = (q: Question, ans: any) => {
    if (ans === undefined) return false;
    if (q.type === 'mcq' || q.type === 'truefalse') {
      return ans === q.correctIndex;
    }
    if (q.type === 'matching') {
      const scrambled = ans.scrambled;
      const matches = ans.matches || ans;
      if (!scrambled || !matches || !q.pairs) return false;
      return q.pairs.every((pair, pIdx) => {
        const correctTargetIdx = scrambled.indexOf(pair.target);
        return matches[pIdx] === correctTargetIdx;
      });
    }
    if (q.type === 'essay') {
      return ans?.selfGrade === 'correct';
    }
    if (q.type === 'case' && q.subQuestions) {
      return q.subQuestions.every((subQ) => {
        const subAns = ans[subQ.id];
        if (subAns === undefined) return false;
        if (subQ.type === 'mcq') {
          return subAns === subQ.correctIndex;
        }
        if (subQ.type === 'essay') {
          return subAns?.selfGrade === 'correct';
        }
        return false;
      });
    }
    return false;
  };

  const handleFinishQuiz = (answers: Record<number, any>, elapsedSeconds: number, flaggedQuestions: Set<number>) => {
    const questions = quizPayload!.questions;
    
    // Points-based calculations matching ResultsDashboard
    let total = 0;
    let correct = 0;

    questions.forEach((q, i) => {
      const ans = answers[i];
      if (q.type === 'case' && q.subQuestions) {
        total += q.subQuestions.length;
        if (ans) {
          q.subQuestions.forEach((subQ) => {
            const subAns = ans[subQ.id];
            if (subAns !== undefined) {
              const isSubCorrect = subQ.type === 'mcq'
                ? subAns === subQ.correctIndex
                : subAns?.selfGrade === 'correct';
              if (isSubCorrect) correct++;
            }
          });
        }
      } else {
        total += 1;
        if (ans !== undefined && checkAnswerCorrect(q, ans)) {
          correct++;
        }
      }
    });

    saveQuizResult({
      chapterId: quizPayload!.chapter.id,
      chapterTitle: quizPayload!.chapter.title,
      subjectName: quizPayload!.subject?.name ?? 'All Subjects',
      correct,
      total,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0,
      elapsedSeconds,
    });

    transitionTo(() => {
      setResultPayload({ chapter: quizPayload!.chapter, subject: quizPayload!.subject, questions, answers, elapsedSeconds, flaggedQuestions });
      setScreen('results');
    });
  };

  const handleRetake = () => {
    if (!quizPayload) return;
    transitionTo(() => {
      setQuizPayload({ ...quizPayload, questions: quizPayload.questions });
      setScreen('quiz');
    });
  };

  const handleBackToChapters = () => {
    transitionTo(() => {
      setSelectedChapter(null);
      setQuizPayload(null);
      setResultPayload(null);
      setScreen('chapters');
    });
  };

  return (
    <ThemeProvider>
      {screen === 'chapters' && <ChapterSelect onSelectChapter={handleSelectChapter} />}
      {screen === 'subjects' && selectedChapter && (
        <SubjectSelect
          chapter={selectedChapter}
          onBack={handleBackToChapters}
          onSelectSubject={handleSelectSubject}
          onQuickStart={handleQuickStart}
        />
      )}
      {screen === 'quiz' && quizPayload && (
        <QuizInterface
          chapter={quizPayload.chapter}
          subject={quizPayload.subject}
          questions={quizPayload.questions}
          onBack={() => setScreen('subjects')}
          onFinish={handleFinishQuiz}
        />
      )}
      {screen === 'results' && resultPayload && (
        <ResultsDashboard
          chapter={resultPayload.chapter}
          subject={resultPayload.subject}
          questions={resultPayload.questions}
          answers={resultPayload.answers}
          elapsedSeconds={resultPayload.elapsedSeconds}
          flaggedQuestions={resultPayload.flaggedQuestions}
          onRetake={handleRetake}
          onTryAnotherSubject={() => setScreen('subjects')}
          onBackToChapters={handleBackToChapters}
          onBackToSubjects={() => setScreen('subjects')}
        />
      )}
    </ThemeProvider>
  );
}
