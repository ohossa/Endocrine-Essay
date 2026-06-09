import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Check,
  X,
  XCircle,
  Clock,
  Activity,
  Award,
  Lightbulb,
  Bookmark,
  Flag,
  RotateCcw,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react';
import { ChapterData, SubjectData, Question, SubjectColor, subjectStyles, formatTime } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  chapter: ChapterData;
  subject: SubjectData | null;
  questions: Question[];
  answers: Record<number, any>;
  elapsedSeconds: number;
  flaggedQuestions: Set<number>;
  onRetake: () => void;
  onTryAnotherSubject: () => void;
  onBackToChapters: () => void;
  onBackToSubjects: () => void;
}

function getPerformanceLabel(pct: number): string {
  if (pct >= 90) return 'Outstanding!';
  if (pct >= 75) return 'Great Performance!';
  if (pct >= 60) return 'Good Effort!';
  if (pct >= 40) return 'Keep Practicing!';
  return 'Need More Review';
}

function getPerformanceBadge(pct: number): string {
  if (pct >= 90) return 'Exceptional Work';
  if (pct >= 75) return 'Excellent Work';
  if (pct >= 60) return 'Good Work';
  return 'Keep Going';
}

export function ResultsDashboard({
  chapter, subject, questions, answers, elapsedSeconds, flaggedQuestions,
  onRetake, onTryAnotherSubject, onBackToChapters, onBackToSubjects,
}: Props) {
  const [filter, setFilter] = useState<'all' | 'wrong' | 'flagged'>('all');

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

  const renderFormattedText = (
    text: string | undefined,
    fallbackClassName: string = "text-sm font-semibold text-success-dark dark:text-green-300 leading-relaxed whitespace-pre-wrap"
  ) => {
    if (!text) return null;
    if (text.includes('|')) {
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      const rows = lines
        .filter((line) => !line.includes('---') && line.includes('|'))
        .map((line) => {
          const parts = line.split('|');
          if (parts[0] === '') parts.shift();
          if (parts[parts.length - 1] === '') parts.pop();
          return parts.map((cell) => cell.trim());
        });

      if (rows.length > 0) {
        const headers = rows[0];
        const bodyRows = rows.slice(1);

        return (
          <div className="overflow-x-auto my-4 rounded-2xl border border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-950 text-left">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-250 dark:border-gray-800">
                  {headers.map((h, idx) => (
                    <th key={idx} className="p-4 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/30 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-4 text-xs sm:text-sm font-medium text-gray-750 dark:text-gray-350">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }
    return (
      <div className={fallbackClassName}>
        {text}
      </div>
    );
  };

  // Points-based calculations for case sub-questions
  const getPointsStats = () => {
    let totalPoints = 0;
    let correctPoints = 0;

    questions.forEach((q, i) => {
      const ans = answers[i];
      if (q.type === 'case' && q.subQuestions) {
        totalPoints += q.subQuestions.length;
        if (ans) {
          q.subQuestions.forEach((subQ) => {
            const subAns = ans[subQ.id];
            if (subAns !== undefined) {
              const isSubCorrect = subQ.type === 'mcq'
                ? subAns === subQ.correctIndex
                : subAns?.selfGrade === 'correct';
              if (isSubCorrect) correctPoints++;
            }
          });
        }
      } else {
        totalPoints += 1;
        if (ans !== undefined && checkAnswerCorrect(q, ans)) {
          correctPoints++;
        }
      }
    });

    return { totalPoints, correctPoints };
  };

  const { totalPoints: total, correctPoints: correct } = getPointsStats();
  const incorrect = total - correct;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const flaggedCount = flaggedQuestions.size;

  useEffect(() => {
    if (pct >= 80) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [pct]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (pct / 100) * circumference;

  const subjectColor: SubjectColor = (subject?.id as SubjectColor) ?? 'physiology';
  const s = subjectStyles[subjectColor];

  const visibleQuestions =
    filter === 'wrong'
      ? questions.map((q, i) => ({ q, i })).filter(({ q, i }) => !checkAnswerCorrect(q, answers[i]))
      : filter === 'flagged'
      ? questions.map((q, i) => ({ q, i })).filter(({ i }) => flaggedQuestions.has(i))
      : questions.map((q, i) => ({ q, i }));

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-gray-950 font-manrope">
      <style>{`
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.6); }
          60% { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes drawCircle {
          from { stroke-dashoffset: ${circumference}; }
          to { stroke-dashoffset: ${strokeOffset}; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes badgePop {
          0% { opacity: 0; transform: scale(0) rotate(-10deg); }
          60% { transform: scale(1.15) rotate(3deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(60px) rotate(720deg); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .score-animate { animation: scaleIn 700ms cubic-bezier(0.34,1.56,0.64,1) 200ms both; }
        .score-circle-draw { animation: drawCircle 1200ms cubic-bezier(0.4,0,0.2,1) 400ms both; }
        .score-text-animate { animation: fadeInUp 500ms ease-out 800ms both; }
        .badge-animate { animation: badgePop 500ms cubic-bezier(0.34,1.56,0.64,1) 1000ms both; }
        .stats-animate { animation: fadeInUp 500ms ease-out 600ms both; }
        .header-animate { animation: slideInLeft 500ms ease-out both; }
        .section-animate { animation: fadeInUp 500ms ease-out 400ms both; }
        .card-stagger { animation: fadeInUp 500ms cubic-bezier(0.34,1.56,0.64,1) both; }
        .card-stagger:nth-child(1) { animation-delay: 500ms; }
        .card-stagger:nth-child(2) { animation-delay: 600ms; }
        .card-stagger:nth-child(3) { animation-delay: 700ms; }
        .card-stagger:nth-child(4) { animation-delay: 800ms; }
        .card-stagger:nth-child(5) { animation-delay: 900ms; }
        .review-card { transition: all 350ms cubic-bezier(0.34,1.56,0.64,1); }
        .review-card:hover { transform: translateY(-2px); }
        .action-btn { transition: all 300ms cubic-bezier(0.34,1.56,0.64,1); }
        .action-btn:hover { transform: translateY(-2px) scale(1.01); }
        .action-btn:active { transform: scale(0.97); }
        .blob-1 { animation: float 7s ease-in-out infinite; }
        .blob-2 { animation: float 9s ease-in-out infinite reverse; }
        .blob-3 { animation: float 11s ease-in-out infinite 2s; }
        .confetti-1 { animation: confettiFall 2s ease-in 1.2s both; }
        .confetti-2 { animation: confettiFall 2.3s ease-in 1.4s both; }
        .confetti-3 { animation: confettiFall 1.8s ease-in 1.6s both; }
        .confetti-4 { animation: confettiFall 2.5s ease-in 1.3s both; }
        .confetti-5 { animation: confettiFall 2.1s ease-in 1.5s both; }
        .dot-pattern {
          background-image: radial-gradient(circle, rgba(0,0,0,0.025) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
        .dark .dot-pattern {
          background-image: radial-gradient(circle, rgba(255,255,255,0.025) 1.5px, transparent 1.5px);
        }
        .nav-back { transition: all 250ms cubic-bezier(0.34,1.56,0.64,1); }
        .nav-back:hover { transform: translateX(-3px); }
        .toggle-btn { transition: all 250ms cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>

      {/* HEADER */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToSubjects}
                className="nav-back inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-semibold border border-gray-100 dark:border-gray-700"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-gray-400 dark:text-gray-500 font-medium">Chapter {chapter.id}</span>
                <ChevronRight size={12} className="text-gray-300 dark:text-gray-600" />
                <span className="text-gray-400 dark:text-gray-500 font-medium">{chapter.title}</span>
                <ChevronRight size={12} className="text-gray-300 dark:text-gray-600" />
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${s.bgOp10} ${s.textDark} text-xs font-bold`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.bg}`} />
                  {subject ? subject.name : 'All Subjects'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/5 border border-success/15 rounded-full">
                <CheckCircle2 size={14} className="text-success" />
                <span className="text-xs font-bold text-success-dark">Session Complete</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* HERO SCORE */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="absolute inset-0 dot-pattern" />
        <div className="blob-1 absolute -top-20 right-32 w-64 h-64 rounded-full bg-gradient-to-br from-success/8 to-physiology/6 blur-3xl" />
        <div className="blob-2 absolute -bottom-16 left-16 w-48 h-48 rounded-full bg-gradient-to-br from-clinical/8 to-anatomy/6 blur-3xl" />
        <div className="blob-3 absolute top-10 left-1/3 w-32 h-32 rounded-full bg-gradient-to-br from-biochem/6 to-pharma/4 blur-3xl" />

        {pct >= 75 && (
          <>
            <div className="confetti-1 absolute top-8 left-[20%] w-2 h-2 rounded-full bg-success/60" />
            <div className="confetti-2 absolute top-4 left-[40%] w-1.5 h-1.5 rounded-sm bg-physiology/50 rotate-45" />
            <div className="confetti-3 absolute top-6 left-[60%] w-2 h-2 rounded-full bg-biochem/50" />
            <div className="confetti-4 absolute top-10 left-[75%] w-1.5 h-1.5 rounded-sm bg-anatomy/50 rotate-12" />
            <div className="confetti-5 absolute top-3 left-[85%] w-2 h-2 rounded-full bg-clinical/40" />
          </>
        )}

        <div className="relative max-w-6xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-16">

            {/* Score Circle */}
            <div className="score-animate flex-shrink-0">
              <div className="relative w-48 h-48 lg:w-56 lg:h-56">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="6" className="dark:stroke-gray-800" />
                  <circle
                    className="score-circle-draw"
                    cx="60" cy="60" r={radius} fill="none"
                    stroke="url(#scoreGrad)" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#10B981' }} />
                      <stop offset="50%" style={{ stopColor: '#06B6D4' }} />
                      <stop offset="100%" style={{ stopColor: '#3B82F6' }} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="score-text-animate font-archivo text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                    {pct}
                  </span>
                  <span className="score-text-animate text-lg text-gray-400 dark:text-gray-500 font-bold -mt-1">%</span>
                </div>
              </div>
            </div>

            {/* Score Details */}
            <div className="flex-1 text-center lg:text-left">
              <div className="header-animate">
                <h1 className="font-archivo text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-3">
                  {getPerformanceLabel(pct)}
                </h1>
                <p className="text-gray-400 dark:text-gray-500 text-lg font-medium max-w-lg leading-relaxed mb-6">
                  You graded <strong className="text-gray-700 dark:text-gray-300">{correct} out of {total}</strong> questions correctly
                  {subject ? ` in the ${subject.name} section` : ''}.
                </p>
              </div>

              <div className="badge-animate inline-flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-success/10 to-physiology/10 border border-success/20 rounded-full mb-8">
                <Award size={18} className="text-success" />
                <span className="font-archivo text-sm font-bold text-success-dark uppercase tracking-wide">
                  {getPerformanceBadge(pct)}
                </span>
              </div>

              <div className="stats-animate flex flex-wrap items-center justify-center lg:justify-start gap-3">
                {[
                  { icon: <Check size={14} />, value: correct, label: 'Correct', bg: 'bg-success/5', border: 'border-success/15', iconBg: 'bg-success/15', iconColor: 'text-success', textColor: 'text-success-dark' },
                  { icon: <X size={14} />, value: incorrect, label: 'Incorrect', bg: 'bg-danger/5', border: 'border-danger/15', iconBg: 'bg-danger/15', iconColor: 'text-danger', textColor: 'text-danger-dark' },
                  { icon: <Clock size={14} />, value: formatTime(elapsedSeconds), label: 'Time', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-100 dark:border-gray-700', iconBg: 'bg-gray-100 dark:bg-gray-700', iconColor: 'text-gray-500 dark:text-gray-400', textColor: 'text-gray-700 dark:text-gray-300' },
                  { icon: <Activity size={14} />, value: total, label: 'Total Qs', bg: s.bgOp5, border: s.borderOp15, iconBg: s.bgOp15, iconColor: s.text, textColor: s.textDark },
                ].map((stat) => (
                  <div key={stat.label} className={`flex items-center gap-2.5 px-5 py-3 ${stat.bg} ${stat.border} border rounded-2xl`}>
                    <div className={`w-8 h-8 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                      <span className={stat.iconColor}>{stat.icon}</span>
                    </div>
                    <div>
                      <div className={`font-archivo text-xl font-black ${stat.textColor}`}>{stat.value}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEW SECTION */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 lg:py-14">
        <div className="section-animate flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-success to-physiology" />
            <h2 className="font-archivo text-xl font-bold text-gray-900 dark:text-white tracking-tight">Review Answers & Key Concepts</h2>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold">{total} points total</span>
          </div>

          <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            <button
              className={`toggle-btn px-5 py-2.5 rounded-xl text-xs font-bold ${filter === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
              onClick={() => setFilter('all')}
            >
              All Questions
            </button>
            <button
              className={`toggle-btn px-5 py-2.5 rounded-xl text-xs font-bold ${filter === 'wrong' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
              onClick={() => setFilter('wrong')}
            >
              <span className="flex items-center gap-1.5">
                <XCircle size={14} />
                Wrong / Review Only
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-danger/10 text-danger text-[10px] font-black">
                  {incorrect}
                </span>
              </span>
            </button>
            {flaggedCount > 0 && (
              <button
                className={`toggle-btn px-5 py-2.5 rounded-xl text-xs font-bold ${filter === 'flagged' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
                onClick={() => setFilter('flagged')}
              >
                <span className="flex items-center gap-1.5">
                  <Flag size={14} />
                  Flagged
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                    {flaggedCount}
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {visibleQuestions.map(({ q, i }, staggerIdx) => {
            const userAns = answers[i];
            const isCorrect = checkAnswerCorrect(q, userAns);
            const qColor = q.subjectColor as SubjectColor;

            return (
              <div
                key={i}
                className={`card-stagger review-card bg-white dark:bg-gray-900 rounded-[30px] border overflow-hidden transition-all duration-300 ${
                  q.id === 2
                    ? 'border-pink-300 dark:border-purple-800'
                    : isCorrect
                    ? 'border-gray-100 dark:border-gray-800'
                    : 'border-danger/15'
                }`}
                style={{
                  boxShadow: q.id === 2
                    ? '0 4px 20px rgba(236,72,153,0.1)'
                    : isCorrect
                    ? '0 2px 12px rgba(0,0,0,0.04)'
                    : '0 2px 12px rgba(239,68,68,0.06)',
                  animationDelay: `${500 + staggerIdx * 100}ms`,
                }}
              >
                <div className="flex items-stretch">
                  <div className={`w-1.5 flex-shrink-0 ${isCorrect ? 'bg-success' : 'bg-danger'}`} />
                  <div className="flex-1 p-6 lg:p-7 text-left">
                    {/* Card header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-archivo font-bold text-xs ${
                            isCorrect ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-danger text-white'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">
                          {q.type === 'truefalse'
                            ? 'True / False'
                            : q.type === 'matching'
                            ? 'Matching'
                            : q.type === 'essay'
                            ? 'Essay'
                            : q.type === 'case'
                            ? 'Clinical Case Study'
                            : 'Multiple Choice'}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${subjectStyles[qColor].bgOp10} ${subjectStyles[qColor].textDark}`}>
                          {chapter.subjects.find((s) => s.id === q.subjectColor)?.name ?? q.subjectColor}
                        </span>
                        {flaggedQuestions.has(i) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400">
                            <Flag size={10} className="fill-amber-500 text-amber-500" />
                            Flagged
                          </span>
                        )}
                      </div>
                      <div
                        className={`flex items-center self-start sm:self-auto gap-1.5 px-3 py-1.5 rounded-full ${
                          isCorrect ? 'bg-success/8 border border-success/15' : 'bg-danger/8 border border-danger/15'
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 size={14} className="text-success" />
                        ) : (
                          <XCircle size={14} className="text-danger" />
                        )}
                        <span className={`text-[11px] font-bold ${isCorrect ? 'text-success-dark' : 'text-danger-dark'}`}>
                          {isCorrect ? 'Correct' : 'Needs Review'}
                        </span>
                      </div>
                    </div>

                    {/* Question text / Scenario */}
                    {renderFormattedText(
                      q.text,
                      "font-archivo text-base font-bold text-gray-900 dark:text-white tracking-tight leading-relaxed mb-5 whitespace-pre-line text-left"
                    )}

                    {/* MCQ / TrueFalse Answers review */}
                    {(q.type === 'mcq' || q.type === 'truefalse') && q.options && (
                      <div className="space-y-3 mb-4">
                        <div
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${
                            isCorrect ? 'bg-success/5 border border-success/15' : 'bg-danger/5 border border-danger/15'
                          } border`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isCorrect ? 'bg-success/15' : 'bg-danger/15'
                            }`}
                          >
                            {isCorrect ? <Check size={14} className="text-success" /> : <X size={14} className="text-danger" />}
                          </div>
                          <div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isCorrect ? 'text-success' : 'text-danger'}`}>
                              Your Answer
                            </div>
                            <span
                              className={`text-sm font-semibold ${
                                isCorrect ? 'text-success-dark' : 'text-danger-dark line-through decoration-danger/30'
                              }`}
                            >
                              {userAns !== undefined ? q.options[userAns] : 'Not answered'}
                            </span>
                          </div>
                        </div>

                        {!isCorrect && (
                          <div className="flex items-center gap-3 px-4 py-3 bg-success/5 border border-success/15 rounded-2xl border">
                            <div className="w-8 h-8 rounded-xl bg-success/15 flex items-center justify-center flex-shrink-0">
                              <Check size={14} className="text-success" />
                            </div>
                            <div>
                              <div className="text-[10px] text-success font-bold uppercase tracking-wider mb-0.5">Correct Answer</div>
                              <span className="text-sm font-semibold text-success-dark">{q.options[q.correctIndex ?? 0]}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Matching Review Layout */}
                    {q.type === 'matching' && (() => {
                      const scrambled = userAns?.scrambled || [];
                      const matches = userAns?.matches || userAns || {};
                      return (
                        <div className="space-y-3 mb-4">
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">Pairing Results</div>
                          <div className="grid grid-cols-1 gap-2.5">
                            {q.pairs?.map((pair, pIdx) => {
                              const studentTargetIdx = matches[pIdx];
                              const studentTarget = studentTargetIdx !== undefined ? scrambled[studentTargetIdx] : 'None';
                              const isPairCorrect = studentTargetIdx === scrambled.indexOf(pair.target);

                              return (
                                <div
                                  key={pIdx}
                                  className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    isPairCorrect ? 'bg-success/[0.02] border-success/15' : 'bg-danger/[0.02] border-danger/15'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{pair.premise}</span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 mx-2">→</span>
                                    <span className={`text-sm font-semibold ${isPairCorrect ? 'text-success-dark' : 'text-danger-dark line-through decoration-danger/30'}`}>
                                      {studentTarget}
                                    </span>
                                  </div>
                                  {!isPairCorrect && (
                                    <div className="text-xs font-semibold text-success-dark bg-success/5 border border-success/10 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                                      Correct: <strong className="underline">{pair.target}</strong>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Essay Review Layout */}
                    {q.type === 'essay' && (
                      <div className="space-y-4 mb-4">
                        <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-2">Your Draft Notes</div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed italic whitespace-pre-wrap">
                            {userAns?.text || 'No draft notes recorded.'}
                          </p>
                        </div>
                        <div className="bg-success/[0.02] rounded-2xl p-5 border border-success/10">
                          <div className="text-[10px] text-success font-bold uppercase tracking-wider mb-2">Reference Model Answer</div>
                          {renderFormattedText(q.modelAnswer, "text-sm font-semibold text-success-dark dark:text-green-300 leading-relaxed whitespace-pre-wrap text-left")}
                        </div>
                      </div>
                    )}

                    {/* Case Study Review */}
                    {q.type === 'case' && q.subQuestions && (
                      <div className="space-y-6 mb-4">
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-2">
                          Case Study Questions
                        </div>
                        <div className="space-y-4">
                          {q.subQuestions.map((subQ, sIdx) => {
                            const subAns = userAns?.[subQ.id];
                            const isSubCorrect = subQ.type === 'mcq'
                              ? subAns === subQ.correctIndex
                              : subAns?.selfGrade === 'correct';

                            return (
                              <div
                                key={subQ.id}
                                className={`p-5 rounded-2xl border ${
                                  isSubCorrect
                                    ? 'bg-success/[0.01] border-success/15'
                                    : 'bg-danger/[0.01] border-danger/15'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3 mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[9px] font-bold ${
                                      isSubCorrect ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                                    }`}>
                                      Part {String.fromCharCode(65 + sIdx)}
                                    </span>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">
                                      {subQ.type === 'mcq' ? 'Multiple Choice' : 'Essay'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {isSubCorrect ? (
                                      <CheckCircle2 size={12} className="text-success" />
                                    ) : (
                                      <XCircle size={12} className="text-danger" />
                                    )}
                                    <span className={`text-[10px] font-bold ${isSubCorrect ? 'text-success-dark' : 'text-danger-dark'}`}>
                                      {isSubCorrect ? 'Correct' : 'Needs Review'}
                                    </span>
                                  </div>
                                </div>

                                {renderFormattedText(
                                  subQ.text,
                                  "text-sm font-bold text-gray-900 dark:text-white leading-relaxed mb-3 text-left whitespace-pre-line"
                                )}

                                {subQ.type === 'mcq' && subQ.options && (
                                  <div className="space-y-2">
                                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs ${
                                      isSubCorrect ? 'bg-success/5 border border-success/10' : 'bg-danger/5 border border-danger/10'
                                    } border`}>
                                      <span className="font-bold text-[10px] uppercase">Your Pick:</span>
                                      <span className="font-medium">
                                        {subAns !== undefined ? subQ.options[subAns] : 'Not answered'}
                                      </span>
                                    </div>
                                    {!isSubCorrect && (
                                      <div className="flex items-center gap-2.5 px-3 py-2 bg-success/5 border border-success/10 rounded-xl text-xs border">
                                        <span className="font-bold text-[10px] uppercase text-success">Correct:</span>
                                        <span className="font-medium text-success-dark">
                                          {subQ.options[subQ.correctIndex ?? 0]}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {subQ.type === 'essay' && (
                                  <div className="space-y-3">
                                    <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-3.5 border border-gray-100 dark:border-gray-800 text-xs">
                                      <span className="font-bold text-[10px] uppercase text-gray-400 block mb-1">Your Notes:</span>
                                      <p className="font-medium text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap text-left">
                                        {subAns?.text || 'No draft notes recorded.'}
                                      </p>
                                    </div>
                                    <div className="bg-success/[0.02] rounded-xl p-3.5 border border-success/10 text-xs">
                                      <span className="font-bold text-[10px] uppercase text-success block mb-1">Reference Answer:</span>
                                      {renderFormattedText(subQ.modelAnswer, "text-xs font-semibold text-success-dark dark:text-green-300 leading-relaxed text-left whitespace-pre-wrap")}
                                    </div>
                                  </div>
                                )}

                                {/* Sub-question explanation / concept review */}
                                {subQ.explanation && (
                                  <div className="mt-3 bg-biochem/[0.02] rounded-xl p-3.5 border border-biochem/10 text-xs">
                                    <div className="flex gap-2">
                                      <Lightbulb size={13} className="text-biochem mt-0.5 flex-shrink-0" />
                                      <div className="text-left">
                                        <span className="font-bold text-[10px] uppercase text-biochem-dark block mb-1">Explanation</span>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{subQ.explanation}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {subQ.keyConcept && (
                                  <div className="mt-2 bg-physiology/[0.02] rounded-xl p-3.5 border border-physiology/10 text-xs">
                                    <div className="flex gap-2">
                                      <Bookmark size={13} className="text-physiology mt-0.5 flex-shrink-0" />
                                      <div className="text-left">
                                        <span className="font-bold text-[10px] uppercase text-physiology-dark block mb-1">Key Concept</span>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{subQ.keyConcept}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="bg-biochem/[0.04] rounded-2xl p-5 border border-biochem/15 mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-biochem/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Lightbulb size={14} className="text-biochem" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-biochem-dark uppercase tracking-wider mb-2">Explanation</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{q.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Key concept */}
                    {q.keyConcept && (
                      <div className="bg-physiology/[0.04] rounded-2xl p-5 border border-physiology/15">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-physiology/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bookmark size={14} className="text-physiology" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-physiology-dark uppercase tracking-wider mb-2">Key Concept</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{q.keyConcept}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {visibleQuestions.length === 0 && filter === 'all' && (
            <div className="text-center py-16">
              <CheckCircle2 size={48} className="text-success mx-auto mb-4" />
              <h3 className="font-archivo text-xl font-bold text-gray-900 dark:text-white mb-2">Perfect Score!</h3>
              <p className="text-gray-400 dark:text-gray-500 font-medium">You graded all answers as correct.</p>
            </div>
          )}
          {visibleQuestions.length === 0 && filter === 'wrong' && (
            <div className="text-center py-16">
              <CheckCircle2 size={48} className="text-success mx-auto mb-4" />
              <h3 className="font-archivo text-xl font-bold text-gray-900 dark:text-white mb-2">No Wrong Answers!</h3>
              <p className="text-gray-400 dark:text-gray-500 font-medium">You self-graded every question as correct.</p>
            </div>
          )}
          {visibleQuestions.length === 0 && filter === 'flagged' && (
            <div className="text-center py-16">
              <Flag size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="font-archivo text-xl font-bold text-gray-900 dark:text-white mb-2">No Flagged Questions</h3>
              <p className="text-gray-400 dark:text-gray-500 font-medium">You didn't flag any questions during this session.</p>
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={onRetake}
            className="action-btn flex items-center justify-center gap-3 px-6 py-5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-3xl font-bold text-sm"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            <RotateCcw size={18} />
            Retake Quiz
          </button>
          <button
            onClick={onTryAnotherSubject}
            className="action-btn flex items-center justify-center gap-3 px-6 py-5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-3xl font-bold text-sm border-2 border-gray-100 dark:border-gray-800"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <ArrowRight size={18} />
            Try Another Subject
          </button>
          <button
            onClick={onBackToChapters}
            className="action-btn flex items-center justify-center gap-3 px-6 py-5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-3xl font-bold text-sm border-2 border-gray-100 dark:border-gray-800"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <LayoutGrid size={18} />
            Back to Chapters
          </button>
        </div>

        <div className="mt-12 pb-8 text-center space-y-1">
          <p className="text-[11px] text-gray-300 dark:text-gray-600 font-medium">
            Endocrine Essay Questions • Chapter {chapter.id}: {chapter.title} • {subject ? subject.name : 'All Subjects'} • 2nd Year Medical Students
          </p>
          <p className="text-[11px] text-gray-300 dark:text-gray-600 font-medium">
            For inquiries or to report errors, please contact:{' '}
            <a href="mailto:omarhmaged@gmail.com" className="hover:text-gray-900 dark:hover:text-white transition-colors underline font-semibold">
              omarhmaged@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
