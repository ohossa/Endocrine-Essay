import { useMemo } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Activity,
  FlaskConical,
  Bone,
  Microscope,
  ShieldAlert,
  Pill,
  Stethoscope,
  Zap,
  HelpCircle,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';
import { ChapterData, SubjectData, SubjectColor, subjectStyles } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  chapter: ChapterData;
  onBack: () => void;
  onSelectSubject: (subject: SubjectData, questions: Question[]) => void;
  onQuickStart: (questions: Question[]) => void;
}

import { Question } from '../types';

const iconMap: Record<string, LucideIcon> = {
  Activity,
  FlaskConical,
  Bone,
  Microscope,
  ShieldAlert,
  Pill,
  Stethoscope,
};

const totalQs = (subjects: SubjectData[]) =>
  subjects.reduce((a, s) => a + s.questions.length, 0);

export function SubjectSelect({ chapter, onBack, onSelectSubject, onQuickStart }: Props) {
  const allQuestions = useMemo(() => chapter.subjects.flatMap((s) => s.questions), [chapter]);
  const totalQuestions = useMemo(() => totalQs(chapter.subjects), [chapter.subjects]);

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-gray-950 font-manrope">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.2; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .card-stagger { animation: fadeInUp 600ms cubic-bezier(0.34,1.56,0.64,1) both; }
        .card-stagger:nth-child(1) { animation-delay: 100ms; }
        .card-stagger:nth-child(2) { animation-delay: 160ms; }
        .card-stagger:nth-child(3) { animation-delay: 220ms; }
        .card-stagger:nth-child(4) { animation-delay: 280ms; }
        .card-stagger:nth-child(5) { animation-delay: 340ms; }
        .card-stagger:nth-child(6) { animation-delay: 400ms; }
        .card-stagger:nth-child(7) { animation-delay: 460ms; }
        .subject-card { transition: all 350ms cubic-bezier(0.34,1.56,0.64,1); }
        .subject-card:hover { transform: translateY(-6px) scale(1.02); }
        .subject-card:active { transform: translateY(-2px) scale(0.98); }
        .icon-float { transition: transform 350ms cubic-bezier(0.34,1.56,0.64,1); }
        .subject-card:hover .icon-float { transform: scale(1.15) rotate(-5deg); }
        .arrow-bounce { transition: transform 300ms cubic-bezier(0.34,1.56,0.64,1); }
        .subject-card:hover .arrow-bounce { transform: translateX(4px); }
        .glow-ring { animation: pulseRing 3s ease-in-out infinite; }
        .blob-1 { animation: float 7s ease-in-out infinite; }
        .blob-2 { animation: float 9s ease-in-out infinite reverse; }
        .btn-back { transition: all 250ms cubic-bezier(0.34,1.56,0.64,1); }
        .btn-back:hover { transform: translateX(-3px); }
        .progress-line {
          background: linear-gradient(90deg, #10B981 0%, #06B6D4 50%, #3B82F6 100%);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }
        .dot-pattern {
          background-image: radial-gradient(circle, rgba(0,0,0,0.03) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
        .dark .dot-pattern {
          background-image: radial-gradient(circle, rgba(255,255,255,0.03) 1.5px, transparent 1.5px);
        }
        .header-anim { animation: slideInLeft 500ms ease-out both; }
        .header-anim-delay { animation: slideInLeft 500ms ease-out 100ms both; }
        .stats-anim { animation: fadeInUp 600ms ease-out 300ms both; }
      `}</style>

      {/* STICKY HEADER */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="btn-back inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-semibold border border-gray-100 dark:border-gray-700"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Chapters</span>
              </button>
              <div className="header-anim hidden md:flex items-center gap-2 text-sm">
                <span className="text-gray-400 dark:text-gray-500 font-medium">Endocrine Essay Questions</span>
                <ChevronRight size={12} className="text-gray-300 dark:text-gray-600" />
                <span className="text-gray-900 dark:text-white font-bold">Chapter {chapter.id}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="stats-anim flex items-center gap-2 px-4 py-2 bg-physiology/5 border border-physiology/15 rounded-full">
                <span className="w-2 h-2 rounded-full bg-physiology" />
                <span className="text-xs font-bold text-physiology-dark">
                  {chapter.subjects.length} Subjects Available
                </span>
              </div>
              <ThemeToggle />
            </div>
          </div>
          <div className="h-0.5 -mx-6 lg:-mx-8">
            <div className="progress-line h-full w-full opacity-40 rounded-full" />
          </div>
        </div>
      </header>

      {/* HERO */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="absolute inset-0 dot-pattern" />
        <div className="blob-1 absolute -top-16 right-20 w-56 h-56 rounded-full bg-gradient-to-br from-physiology/8 to-clinical/6 blur-3xl" />
        <div className="blob-2 absolute -bottom-20 left-10 w-48 h-48 rounded-full bg-gradient-to-br from-anatomy/8 to-histology/6 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-10 lg:py-14">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="header-anim inline-flex items-center gap-2.5 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-xs font-bold tracking-wide uppercase mb-5">
                <span className="text-lg">{chapter.emoji}</span>
                Chapter {chapter.id}
              </div>
              <h1 className="header-anim font-archivo text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-3">
                {chapter.title}
              </h1>
              <p className="header-anim-delay text-gray-400 dark:text-gray-500 text-base lg:text-lg font-medium max-w-md leading-relaxed">
                {chapter.subtitle} — Select a subject to begin your essay study.
              </p>
            </div>

            <div className="stats-anim flex items-center gap-5 lg:gap-8 bg-gray-50/80 dark:bg-gray-800/80 px-6 py-4 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="text-center">
                <div className="font-archivo text-2xl font-black text-gray-900 dark:text-white">{chapter.subjects.length}</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">Subjects</div>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
              <div className="text-center">
                <div className="font-archivo text-2xl font-black text-physiology">{totalQuestions}</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">Questions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUBJECT CARDS */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-physiology to-anatomy" />
          <h2 className="font-archivo text-lg font-bold text-gray-900 dark:text-white tracking-tight">Choose Your Subject</h2>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800 ml-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {chapter.subjects.map((subject) => {
            const color = subject.id as SubjectColor;
            const s = subjectStyles[color];
            const Icon = iconMap[subject.iconName] ?? Activity;
            const hasQuestions = subject.questions.length > 0;

            return (
              <div
                key={subject.id}
                className={`card-stagger subject-card bg-white dark:bg-gray-900 rounded-[30px] p-6 border-2 border-gray-100 dark:border-gray-800 ${s.hoverBorder} cursor-pointer group relative overflow-hidden ${!hasQuestions ? 'opacity-60' : ''}`}
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                onMouseEnter={(e) => hasQuestions && ((e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px -8px ${s.hoverShadowRgba}`)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)')}
                onClick={() => hasQuestions && onSelectSubject(subject, subject.questions)}
              >
                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${s.bgOp5} group-hover:${s.bgOp10} transition-colors duration-500`} />
                <div className={`absolute -top-4 -right-4 w-12 h-12 rounded-full ${s.bgOp8} glow-ring`} />

                <div className="relative">
                  <div className={`icon-float w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradientFrom} ${s.gradientTo} flex items-center justify-center mb-4 ${s.borderOp10} border`}>
                    <Icon size={24} className={s.text} />
                  </div>

                  <h3 className={`font-archivo text-lg font-bold text-gray-900 dark:text-white group-hover:${s.text} transition-colors duration-300 tracking-tight mb-1`}>
                    {subject.name}
                  </h3>

                  <div className={`flex items-center gap-2 px-3 py-2 ${s.bgOp5} rounded-xl mb-5 ${s.borderOp10} border`}>
                    <HelpCircle size={14} className={s.text} />
                    <span className={`text-xs font-bold ${s.textDark}`}>
                      {hasQuestions ? `${subject.questions.length} Questions` : 'Coming Soon'}
                    </span>
                  </div>

                  <div className="h-px bg-gray-100 dark:bg-gray-800 mb-4" />

                  <div className="flex items-center justify-end">
                    {hasQuestions && (
                      <div className={`arrow-bounce flex items-center gap-1 text-xs font-bold ${s.text} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                        Begin
                        <ArrowRight size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* QUICK START BANNER */}
        <div
          className="mt-10 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 flex items-center justify-center">
              <Zap size={20} className="text-white dark:text-gray-900" />
            </div>
            <div>
              <h3 className="font-archivo text-base font-bold text-gray-900 dark:text-white tracking-tight">Quick Start — All Subjects</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                Complete assessment of all {totalQuestions} questions from every subject in textbook order
              </p>
            </div>
          </div>
          <button
            disabled={totalQuestions === 0}
            onClick={() => onQuickStart(allQuestions)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 text-white dark:text-gray-900 rounded-full text-sm font-bold tracking-wide transition-all duration-300 hover:scale-[0.97] active:scale-95"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
          >
            Start All
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-10 pb-8 text-center space-y-1.5">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Endocrine Essay Questions • Chapter {chapter.id}: {chapter.title} • 2nd Year Medical Students
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
            For inquiries or errors message <span className="font-semibold text-gray-600 dark:text-gray-450">01040479155</span>
          </p>
        </div>
      </div>
    </div>
  );
}
