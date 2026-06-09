import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Clock,
  Flag,
  Keyboard,
  Target,
  Grid3X3,
  Lightbulb,
  Bookmark,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { ChapterData, SubjectData, Question, SubjectColor, subjectStyles, formatTime } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  chapter: ChapterData;
  subject: SubjectData | null;
  questions: Question[];
  onBack: () => void;
  onFinish: (answers: Record<number, any>, elapsedSeconds: number, flaggedQuestions: Set<number>) => void;
}

export function QuizInterface({ chapter, subject, questions, onBack, onFinish }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [essayDraft, setEssayDraft] = useState('');
  const [showEssayAnswer, setShowEssayAnswer] = useState(false);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [showKeyboardHelper, setShowKeyboardHelper] = useState(false);

  // Spacial state for case studies sub-questions
  const [subEssayDrafts, setSubEssayDrafts] = useState<Record<string, string>>({});
  const [revealedSubEssays, setRevealedSubEssays] = useState<Record<string, boolean>>({});

  const current = questions[currentIdx];
  const subjectColor: SubjectColor = current.subjectColor;
  const s = subjectStyles[subjectColor];

  // Helper check if question is completed
  const isQuestionCompleted = (q: Question, ans: any) => {
    if (ans === undefined) return false;
    if (q.type === 'mcq' || q.type === 'truefalse' || q.type === 'matching' || q.type === 'essay') {
      return true;
    }
    if (q.type === 'case' && q.subQuestions) {
      return q.subQuestions.every((subQ) => ans[subQ.id] !== undefined);
    }
    return false;
  };

  const answered = answers[currentIdx] !== undefined && isQuestionCompleted(current, answers[currentIdx]);

  // Sync draft states when index changes
  useEffect(() => {
    setShowEssayAnswer(false);
    if (current.type === 'essay') {
      setEssayDraft(answers[currentIdx]?.text || '');
    } else if (current.type === 'case' && current.subQuestions) {
      const drafts: Record<string, string> = {};
      const revs: Record<string, boolean> = {};
      current.subQuestions.forEach((subQ) => {
        drafts[subQ.id] = answers[currentIdx]?.[subQ.id]?.text || '';
        revs[subQ.id] = answers[currentIdx]?.[subQ.id] !== undefined;
      });
      setSubEssayDrafts(drafts);
      setRevealedSubEssays(revs);
    }
  }, [currentIdx, current]);

  // Check if answer is correct
  const checkAnswerCorrect = (q: Question, ans: any, idx: number) => {
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

  const isCorrect = answered && checkAnswerCorrect(current, answers[currentIdx], currentIdx);

  // Keyboard navigation & actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }
      const k = e.key.toUpperCase();
      if (k === 'F') {
        toggleFlag(currentIdx);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx((i) => i + 1);
        }
      } else if (e.key === 'Enter') {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx((i) => i + 1);
        } else {
          handleFinish();
        }
      } else if (e.key === 'Escape') {
        setShowKeyboardHelper(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, answers, questions]);

  const toggleFlag = (idx: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleFinish = () => {
    onFinish(answers, elapsed, flagged);
  };

  // Live Stats calculations
  const getLiveStats = () => {
    let answeredCount = 0;
    let correctCount = 0;

    questions.forEach((q, idx) => {
      const ans = answers[idx];
      if (ans !== undefined && isQuestionCompleted(q, ans)) {
        answeredCount++;
        if (checkAnswerCorrect(q, ans, idx)) {
          correctCount++;
        }
      }
    });

    return { answeredCount, correctCount };
  };

  const { answeredCount, correctCount } = getLiveStats();
  const pct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100);

  const handleTick = useCallback((seconds: number) => {
    setElapsed(seconds);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-gray-950 font-manrope">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes correctGlow {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes wrongShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .feedback-animate { animation: fadeInUp 350ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .correct-glow { animation: correctGlow 1.2s infinite; }
        .wrong-shake { animation: wrongShake 400ms ease; }
        .nav-btn { transition: all 250ms cubic-bezier(0.34, 1.56, 0.64, 1); }
        .nav-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .nav-btn:active:not(:disabled) { transform: scale(0.97); }
        .sidebar-card { transition: all 300ms ease; }
        .option-btn { transition: all 200ms ease; }
        .option-btn:hover:not(:disabled) { transform: translateY(-1px); }
      `}</style>

      {/* HEADER */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="nav-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-semibold border border-gray-100 dark:border-gray-700"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-gray-400 dark:text-gray-500 font-medium">Chapter {chapter.id}</span>
                <span className="text-gray-300 dark:text-gray-700">/</span>
                <span className="text-gray-900 dark:text-white font-bold max-w-[200px] truncate">{chapter.title}</span>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-4">
              <QuizTimer onTick={handleTick} />
              <button
                onClick={() => setShowKeyboardHelper(true)}
                className="hidden md:flex items-center justify-center w-9 h-9 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Keyboard Shortcuts"
              >
                <Keyboard size={16} />
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800 w-full relative">
          <div
            className={`h-full ${s.bg} transition-all duration-300 ease-out`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* QUIZ CONTENT */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          
          {/* Main Card */}
          <div className="flex-1 w-full bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 p-6 lg:p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
            
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full ${s.bgOp10} ${s.textDark} text-xs font-bold`}>
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-xs text-gray-300 dark:text-gray-600 font-bold uppercase tracking-wider">•</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                  {current.type === 'case' ? 'Clinical Case' : 'Essay'}
                </span>
              </div>
              
              <button
                onClick={() => toggleFlag(currentIdx)}
                className={`p-2 rounded-2xl border transition-all ${
                  flagged.has(currentIdx)
                    ? 'bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/20 dark:border-amber-700'
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 hover:text-gray-650'
                }`}
                title="Flag for Review (Press 'F')"
              >
                <Flag size={16} className={flagged.has(currentIdx) ? 'fill-amber-500' : ''} />
              </button>
            </div>

            {/* Question Text */}
            <h2 className="font-archivo text-xl lg:text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-relaxed mb-6 text-left whitespace-pre-line">
              {current.text}
            </h2>

            {/* ANSWER AREA */}
            <div className="mt-8">
              
              {/* Essay Type Question */}
              {current.type === 'essay' && (
                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      rows={5}
                      disabled={answered}
                      value={essayDraft}
                      onChange={(e) => setEssayDraft(e.target.value)}
                      placeholder="Type your answer here (optional). If solving in your head, just click 'Reveal Model Answer' below to grade yourself..."
                      className="w-full rounded-[24px] border-2 border-gray-100 dark:border-gray-800 p-5 text-sm font-semibold bg-white dark:bg-gray-900 focus:border-physiology focus:outline-none disabled:bg-gray-50 dark:disabled:bg-gray-950 disabled:opacity-85 text-gray-700 dark:text-gray-300 text-left"
                    />
                  </div>

                  {!answered && !showEssayAnswer && (
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowEssayAnswer(true)}
                        className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-xs font-bold tracking-wide hover:scale-[0.98] transition-transform"
                      >
                        Reveal Model Answer
                      </button>
                    </div>
                  )}

                  {(showEssayAnswer || answered) && (
                    <div className="feedback-animate bg-success/[0.03] border border-success/15 rounded-3xl p-6 text-left">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb size={16} className="text-success" />
                        <span className="text-xs font-bold text-success uppercase tracking-wider">Model Answer Reference</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">
                        {current.modelAnswer}
                      </p>

                      {/* Display Key Concept immediately upon model answer reveal */}
                      {current.keyConcept && (
                        <div className="mt-3 mb-4 p-4 rounded-2xl bg-biochem/[0.04] border border-biochem/15 flex items-start gap-3">
                          <Bookmark size={16} className="text-biochem mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[10px] font-bold text-biochem-dark uppercase tracking-wider block mb-0.5">Key Concept</span>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{current.keyConcept}</p>
                          </div>
                        </div>
                      )}

                      {!answered && (
                        <div className="pt-4 border-t border-success/10">
                          <h4 className="font-archivo text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Self-Grading: Did you get it right? (Be lenient: if you got the general idea or key words, mark it correct!)
                          </h4>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setAnswers((prev) => ({
                                  ...prev,
                                  [currentIdx]: { text: essayDraft, selfGrade: 'correct' },
                                }));
                                setShowEssayAnswer(false);
                              }}
                              className="px-5 py-2.5 bg-success text-white hover:bg-success-dark rounded-full text-xs font-bold tracking-wide transition-all"
                            >
                              I got it right
                            </button>
                            <button
                              onClick={() => {
                                setAnswers((prev) => ({
                                  ...prev,
                                  [currentIdx]: { text: essayDraft, selfGrade: 'incorrect' },
                                }));
                                setShowEssayAnswer(false);
                              }}
                              className="px-5 py-2.5 bg-white dark:bg-gray-900 border border-danger/25 text-danger-dark hover:bg-danger/5 rounded-full text-xs font-bold tracking-wide transition-all"
                            >
                              I need more review
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Case Study Type Question (Sub-questions) */}
              {current.type === 'case' && current.subQuestions && (
                <div className="space-y-6">
                  {current.subQuestions.map((subQ, sIdx) => {
                    const subAnswer = answers[currentIdx]?.[subQ.id];
                    const isSubQAnswered = subAnswer !== undefined;

                    return (
                      <div
                        key={subQ.id}
                        className="p-6 rounded-2xl bg-white/75 dark:bg-gray-900/75 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${s.bgOp10} ${s.textDark} text-[10px] font-bold uppercase tracking-wider`}>
                            Part {String.fromCharCode(65 + sIdx)}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                            {subQ.type === 'mcq' ? 'Multiple Choice' : 'Essay'}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-gray-900 dark:text-white leading-relaxed text-left">
                          {subQ.text}
                        </h4>

                        {/* MCQ sub-type */}
                        {subQ.type === 'mcq' && subQ.options && (
                          <div className="space-y-2.5 text-left">
                            {subQ.options.map((option, optIdx) => {
                              const isSelected = subAnswer === optIdx;
                              const isCorrectOpt = optIdx === subQ.correctIndex;

                              let optClass = 'w-full text-left rounded-2xl px-5 py-4 border-2 transition-all flex items-center gap-4 cursor-pointer relative overflow-hidden ';
                              if (!isSubQAnswered) {
                                optClass += 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700';
                              } else if (isCorrectOpt) {
                                optClass += 'border-success bg-success/[0.03] correct-glow';
                              } else if (isSelected && !isCorrectOpt) {
                                optClass += 'border-danger bg-danger/[0.02] wrong-shake';
                              } else {
                                optClass += 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed';
                              }

                              return (
                                <div
                                  key={optIdx}
                                  className={optClass}
                                  onClick={() => {
                                    if (isSubQAnswered) return;
                                    setAnswers((prev) => {
                                      const cur = prev[currentIdx] || {};
                                      return {
                                        ...prev,
                                        [currentIdx]: { ...cur, [subQ.id]: optIdx }
                                      };
                                    });
                                  }}
                                >
                                  {isSubQAnswered && isCorrectOpt ? (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-success/10 border border-success/30 flex items-center justify-center">
                                      <Check size={16} className="text-success" />
                                    </div>
                                  ) : isSubQAnswered && isSelected && !isCorrectOpt ? (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-danger/10 border border-danger/25 flex items-center justify-center">
                                      <X size={16} className="text-danger" />
                                    </div>
                                  ) : (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center font-archivo font-bold text-xs text-gray-400 dark:text-gray-500">
                                      {String.fromCharCode(65 + optIdx)}
                                    </div>
                                  )}

                                  <span className={`text-sm font-semibold leading-snug flex-1 ${
                                    isSubQAnswered && isCorrectOpt
                                      ? 'text-success-dark'
                                      : isSubQAnswered && isSelected && !isCorrectOpt
                                      ? 'text-danger-dark line-through decoration-danger/30'
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {option}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Essay sub-type */}
                        {subQ.type === 'essay' && (
                          <div className="space-y-3 text-left">
                            <textarea
                              rows={3}
                              disabled={isSubQAnswered}
                              value={subEssayDrafts[subQ.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSubEssayDrafts((prev) => ({ ...prev, [subQ.id]: val }));
                              }}
                              placeholder="Type notes (optional). If solving in your head, just click 'Reveal Model Answer' below to grade yourself..."
                              className="w-full rounded-2xl border-2 border-gray-100 dark:border-gray-800 p-4 text-xs font-semibold bg-white dark:bg-gray-900 focus:border-physiology focus:outline-none disabled:bg-gray-50 dark:disabled:bg-gray-950 disabled:opacity-85 text-gray-700 dark:text-gray-300"
                            />

                            {!isSubQAnswered && !revealedSubEssays[subQ.id] && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => setRevealedSubEssays((prev) => ({ ...prev, [subQ.id]: true }))}
                                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-[10px] font-bold tracking-wide hover:scale-[0.98] transition-transform"
                                >
                                  Reveal Model Answer
                                </button>
                              </div>
                            )}

                            {(revealedSubEssays[subQ.id] || isSubQAnswered) && (
                              <div className="feedback-animate bg-success/[0.03] border border-success/15 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-1.5 text-success">
                                  <Lightbulb size={14} />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">Model Answer Reference</span>
                                </div>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                  {subQ.modelAnswer}
                                </p>

                                {/* Display Key Concept immediately upon model answer reveal */}
                                {subQ.keyConcept && (
                                  <div className="p-3 rounded-xl bg-biochem/[0.04] border border-biochem/15 flex items-start gap-2.5">
                                    <Bookmark size={14} className="text-biochem mt-0.5 flex-shrink-0" />
                                    <div>
                                      <span className="text-[9px] font-bold text-biochem-dark uppercase tracking-wider block mb-0.5">Key Concept</span>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{subQ.keyConcept}</p>
                                    </div>
                                  </div>
                                )}

                                {!isSubQAnswered && (
                                  <div className="pt-3 border-t border-success/10">
                                    <h5 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                      Did you get this correct? (Be lenient: if you got the general idea or key words, mark it correct!)
                                    </h5>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          setAnswers((prev) => {
                                            const cur = prev[currentIdx] || {};
                                            return {
                                              ...prev,
                                              [currentIdx]: {
                                                ...cur,
                                                [subQ.id]: { text: subEssayDrafts[subQ.id] || '', selfGrade: 'correct' }
                                              }
                                            };
                                          });
                                        }}
                                        className="px-3 py-1.5 bg-success text-white hover:bg-success-dark rounded-full text-[9px] font-bold tracking-wide transition-all"
                                      >
                                        Correct
                                      </button>
                                      <button
                                        onClick={() => {
                                          setAnswers((prev) => {
                                            const cur = prev[currentIdx] || {};
                                            return {
                                              ...prev,
                                              [currentIdx]: {
                                                ...cur,
                                                [subQ.id]: { text: subEssayDrafts[subQ.id] || '', selfGrade: 'incorrect' }
                                              }
                                            };
                                          });
                                        }}
                                        className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-danger/25 text-danger-dark hover:bg-danger/5 rounded-full text-[9px] font-bold tracking-wide transition-all"
                                      >
                                        Needs Review
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FEEDBACK BOX (AFTER COMPLETING THE QUESTION) */}
            {answered && (
              <div key={`fb-${currentIdx}`} className="feedback-animate mt-6 space-y-4 text-left">
                {current.type === 'essay' && (
                  isCorrect ? (
                    <div className="rounded-3xl bg-success/[0.04] border border-success/15 px-7 py-5 flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center mt-0.5">
                        <Check size={20} className="text-success" />
                      </div>
                      <div>
                        <h4 className="font-archivo text-sm font-bold text-success-dark mb-1">Self-Assessment: Correct</h4>
                        <p className="text-sm text-success-dark/70 leading-relaxed">
                          You marked your draft answer as matching the key concepts.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-danger/[0.04] border border-danger/15 px-7 py-5 flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-danger/10 flex items-center justify-center mt-0.5">
                        <AlertCircle size={20} className="text-danger" />
                      </div>
                      <div>
                        <h4 className="font-archivo text-sm font-bold text-danger-dark mb-1">Self-Assessment: Needs Review</h4>
                        <p className="text-sm text-danger-dark/70 leading-relaxed">
                          You marked your draft answer as needing more study.
                        </p>
                      </div>
                    </div>
                  )
                )}

                {current.type === 'case' && (
                  isCorrect ? (
                    <div className="rounded-3xl bg-success/[0.04] border border-success/15 px-7 py-5 flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center mt-0.5">
                        <Check size={20} className="text-success" />
                      </div>
                      <div>
                        <h4 className="font-archivo text-sm font-bold text-success-dark mb-1">Case Completed!</h4>
                        <p className="text-sm text-success-dark/70 leading-relaxed">
                          Great job — you answered all parts of this clinical case study correctly.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-danger/[0.04] border border-danger/15 px-7 py-5 flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-danger/10 flex items-center justify-center mt-0.5">
                        <AlertCircle size={20} className="text-danger" />
                      </div>
                      <div>
                        <h4 className="font-archivo text-sm font-bold text-danger-dark mb-1">Case Completed with Review</h4>
                        <p className="text-sm text-danger-dark/70 leading-relaxed">
                          You completed the case. Review any parts marked for review above.
                        </p>
                      </div>
                    </div>
                  )
                )}

                {current.explanation && (
                  <div className="rounded-3xl bg-success/[0.04] border border-success/15 px-7 py-5 flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center mt-0.5">
                      <Lightbulb size={20} className="text-success" />
                    </div>
                    <div>
                      <h4 className="font-archivo text-sm font-bold text-success-dark mb-1">Explanation</h4>
                      <p className="text-sm text-gray-650 dark:text-gray-405 leading-relaxed">{current.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NAVIGATION DOTS AND BUTTONS */}
            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="nav-btn inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 text-gray-650 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              {/* Sliding navigation dots window */}
              {(() => {
                const WINDOW = 13;
                const total = questions.length;
                const half = Math.floor(WINDOW / 2);
                let start = Math.max(0, currentIdx - half);
                let end = Math.min(total - 1, start + WINDOW - 1);
                if (end - start < WINDOW - 1) start = Math.max(0, end - WINDOW + 1);
                const showLeftEllipsis = start > 0;
                const showRightEllipsis = end < total - 1;
                const visibleIdxs = Array.from({ length: end - start + 1 }, (_, k) => start + k);
                return (
                  <div className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    {showLeftEllipsis && <span className="text-gray-300 dark:text-gray-600 text-xs font-bold px-0.5">…</span>}
                    {visibleIdxs.map((idx) => {
                      const q = questions[idx];
                      const ans = answers[idx];
                      const isCurrent = idx === currentIdx;
                      const isCompleted = ans !== undefined && isQuestionCompleted(q, ans);
                      const wasCorrect = isCompleted && checkAnswerCorrect(q, ans, idx);
                      const isFlagged = flagged.has(idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentIdx(idx)}
                          className={`rounded-full transition-all duration-250 ${
                            isCurrent
                              ? 'w-3.5 h-3.5 bg-gray-900 dark:bg-white ring-4 ring-gray-900/10 dark:ring-white/10'
                              : isFlagged
                              ? 'w-2.5 h-2.5 bg-amber-400'
                              : isCompleted
                              ? `w-2.5 h-2.5 ${wasCorrect ? 'bg-success' : 'bg-danger'}`
                              : 'w-2.5 h-2.5 bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      );
                    })}
                    {showRightEllipsis && <span className="text-gray-300 dark:text-gray-600 text-xs font-bold px-0.5">…</span>}
                  </div>
                );
              })()}

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((i) => i + 1)}
                  className="nav-btn inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-105 text-white dark:text-gray-900 text-sm font-bold"
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                >
                  Next Question
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="nav-btn inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-physiology hover:bg-physiology-dark text-white text-sm font-bold"
                  style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
                >
                  Finish
                  <Check size={16} />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full xl:w-72 flex-shrink-0">
            <div className="xl:sticky xl:top-24 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-5 text-left">
              
              {/* Score tracker */}
              <div className="sidebar-card bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Target size={16} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Session Progress</span>
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#F3F4F6" strokeWidth="4" className="dark:stroke-gray-800" />
                      <circle
                        cx="32" cy="32" r="28" fill="none"
                        stroke="#22C55E" strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 600ms ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-archivo text-lg font-black text-gray-900 dark:text-white">{pct}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-archivo font-black text-gray-900 dark:text-white">
                      {correctCount}<span className="text-gray-350 dark:text-gray-600">/</span>{answeredCount}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Correct Points</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Correct', value: correctCount, color: 'bg-success', textColor: 'text-success' },
                    { label: 'Incorrect', value: answeredCount - correctCount, color: 'bg-danger', textColor: 'text-danger' },
                    { label: 'Remaining', value: questions.length - answeredCount, color: 'bg-gray-300 dark:bg-gray-600', textColor: 'text-gray-400 dark:text-gray-500' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${row.color}`} />
                        <span className="font-semibold text-gray-650 dark:text-gray-400">{row.label}</span>
                      </div>
                      <span className={`font-bold ${row.textColor}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Map */}
              <div className="sidebar-card bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Grid3X3 size={16} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Question Map</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {questions.map((q, idx) => {
                    const ans = answers[idx];
                    const isCurrent = idx === currentIdx;
                    const isCompleted = ans !== undefined && isQuestionCompleted(q, ans);
                    const wasCorrect = isCompleted && checkAnswerCorrect(q, ans, idx);
                    const isFlagged = flagged.has(idx);

                    let cls = 'w-full aspect-square rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition-all border-2 ';
                    if (isCurrent) cls += 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900 ring-4 ring-gray-900/10 dark:ring-white/10';
                    else if (isFlagged) cls += 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400';
                    else if (wasCorrect) cls += 'bg-success/10 border-success/30 text-success';
                    else if (isCompleted) cls += 'bg-danger/10 border-danger/30 text-danger';
                    else cls += 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-650';

                    return (
                      <button key={idx} className={cls} onClick={() => setCurrentIdx(idx)}>
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-x-4 gap-y-1.5">
                  {[
                    { color: 'bg-success', label: 'Correct' },
                    { color: 'bg-danger', label: 'Wrong' },
                    { color: 'bg-amber-400', label: 'Flagged' },
                    { color: 'bg-gray-900 dark:bg-white', label: 'Current' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                      <span className={`w-2 h-2 rounded ${item.color}`} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Info */}
              <div className={`sidebar-card bg-gradient-to-br ${s.bgOp5} to-clinical/5 rounded-3xl p-5 ${s.borderOp10} border md:col-span-2 xl:col-span-1`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bgOp15} flex items-center justify-center`}>
                    <Activity size={18} className={s.text} />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${s.textDark} uppercase tracking-wider`}>
                      {subject ? subject.name : 'All Subjects'}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Chapter {chapter.id}: {chapter.title}. {chapter.subtitle}.
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-8">
        <p className="text-center text-[11px] text-gray-300 dark:text-gray-600 font-medium">
          Endocrine Essay Questions • Chapter {chapter.id}: {chapter.title} • {subject ? subject.name : 'All Subjects'}
        </p>
      </div>

      {/* KEYBOARD SHORTCUTS HELPER MODAL */}
      {showKeyboardHelper && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-[30px] border border-gray-100 dark:border-gray-800 max-w-md w-full p-8 shadow-2xl relative overflow-hidden feedback-animate">
            <button
              onClick={() => setShowKeyboardHelper(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-physiology/10 flex items-center justify-center text-physiology">
                <Keyboard size={20} />
              </div>
              <h3 className="font-archivo text-lg font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
            </div>

            <div className="space-y-4 text-left">
              {[
                { keys: ['F'], desc: 'Flag / Unflag Question' },
                { keys: ['←', '→'], desc: 'Navigate to Previous / Next Question' },
                { keys: ['Enter'], desc: 'Advance to Next Question / Finish' },
                { keys: ['Esc'], desc: 'Close this shortcuts window' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800/60 last:border-b-0">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{item.desc}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    {item.keys.map((k) => (
                      <kbd key={k} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-850 border border-gray-200 dark:border-gray-750 font-mono text-xs font-bold text-gray-800 dark:text-gray-250 shadow-sm">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowKeyboardHelper(false)}
              className="mt-6 w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl text-xs hover:scale-[0.98] transition-transform"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TimerProps {
  onTick: (seconds: number) => void;
}

function QuizTimer({ onTick }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        onTick(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onTick]);

  return (
    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-105 dark:border-gray-750">
      <Clock size={14} className="text-gray-400 dark:text-gray-500" />
      <span className="text-sm font-semibold text-gray-650 dark:text-gray-300 tabular-nums">{formatTime(seconds)}</span>
    </div>
  );
}
