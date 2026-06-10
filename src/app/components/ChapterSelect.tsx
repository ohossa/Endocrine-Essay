import { useState, useEffect } from 'react';
import { GraduationCap, Layers, ArrowRight, Palette, Clock, Award, Trash2 } from 'lucide-react';
import { ChapterData, SubjectColor, formatTime } from '../types';
import { chapters } from '../data';
import { ThemeToggle } from './ThemeToggle';
import { getQuizHistory, clearQuizHistory, QuizResult } from '../utils/storage';

interface Props {
  onSelectChapter: (chapter: ChapterData) => void;
  onSelectHistory?: (result: QuizResult) => void;
}

const badgeColors: Record<SubjectColor, string> = {
  anatomy: 'bg-anatomy/10 text-anatomy',
  histology: 'bg-histology/10 text-histology',
  physiology: 'bg-physiology/10 text-physiology',
  biochem: 'bg-biochem/10 text-biochem',
  pathology: 'bg-pathology/10 text-pathology',
  pharma: 'bg-pharma/10 text-pharma',
  clinical: 'bg-clinical/10 text-clinical',
};

const dotColors: Record<SubjectColor, string> = {
  anatomy: 'bg-anatomy',
  histology: 'bg-histology',
  physiology: 'bg-physiology',
  biochem: 'bg-biochem',
  pathology: 'bg-pathology',
  pharma: 'bg-pharma',
  clinical: 'bg-clinical',
};

const cornerGradient: Record<SubjectColor, string> = {
  physiology: 'from-physiology/5',
  anatomy: 'from-anatomy/5',
  biochem: 'from-biochem/5',
  pathology: 'from-pathology/5',
  pharma: 'from-pharma/5',
  histology: 'from-histology/5',
  clinical: 'from-clinical/5',
};

const hoverText: Record<SubjectColor, string> = {
  physiology: 'group-hover:text-physiology',
  anatomy: 'group-hover:text-anatomy',
  biochem: 'group-hover:text-biochem',
  pathology: 'group-hover:text-pathology',
  pharma: 'group-hover:text-pharma',
  histology: 'group-hover:text-histology',
  clinical: 'group-hover:text-clinical',
};

function pctColor(pct: number) {
  if (pct >= 75) return 'text-physiology';
  if (pct >= 50) return 'text-biochem';
  return 'text-pathology';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ChapterSelect({ onSelectChapter, onSelectHistory }: Props) {
  const [history, setHistory] = useState<QuizResult[]>([]);

  useEffect(() => {
    setHistory(getQuizHistory().slice(0, 6));
  }, []);

  const handleClearHistory = () => {
    clearQuizHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-manrope">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        .card-animate { animation: fadeInUp 600ms cubic-bezier(0.34,1.56,0.64,1) both; }
        .card-animate:nth-child(1) { animation-delay: 80ms; }
        .card-animate:nth-child(2) { animation-delay: 160ms; }
        .card-animate:nth-child(3) { animation-delay: 240ms; }
        .card-animate:nth-child(4) { animation-delay: 320ms; }
        .card-animate:nth-child(5) { animation-delay: 400ms; }
        .header-anim { animation: fadeInUp 500ms ease-out both; }
        .header-sub { animation: fadeInUp 500ms ease-out 150ms both; }
        .header-stats { animation: fadeInUp 500ms ease-out 300ms both; }
        .blob-1 { animation: float 6s ease-in-out infinite; transform: translate3d(0, 0, 0); will-change: transform; }
        .blob-2 { animation: float 8s ease-in-out infinite reverse; transform: translate3d(0, 0, 0); will-change: transform; }
        .dot-grid {
          background-image: radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .dark .dot-grid {
          background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(18px) saturate(130%);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }
        .dark .glass-panel {
          background: rgba(15, 15, 25, 0.65);
          backdrop-filter: blur(18px) saturate(130%);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .gradient-title {
          background: linear-gradient(120deg, #10B981, #06B6D4, #3B82F6, #8B5CF6);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 8s ease infinite;
        }
        .chapter-card {
          transition: all 350ms cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 10px 20px -5px rgba(0, 0, 0, 0.02);
        }
        .chapter-card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.08), 0 8px 24px -8px rgba(0, 0, 0, 0.04);
        }
        .chapter-card:active { transform: translateY(-2px) scale(0.995); }
        .btn-start { transition: all 300ms cubic-bezier(0.34,1.56,0.64,1); }
        .btn-start:hover { transform: scale(0.97); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .btn-start:active { transform: scale(0.94); }
        .badge-pill { transition: all 200ms ease; }
        .badge-pill:hover { transform: scale(1.08); }
        .history-card { transition: all 250ms ease; }
        .history-card:hover { transform: translateY(-2px); }
        .ecg-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawLine 6s linear infinite;
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }
      `}</style>

      {/* HERO HEADER */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="absolute inset-0 dot-grid opacity-50" />
        <div className="blob-1 absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-physiology/10 to-clinical/10 blur-3xl" />
        <div className="blob-2 absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-gradient-to-br from-biochem/10 to-pharma/10 blur-3xl" />

        {/* ECG Heartbeat line background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
          <svg className="w-full h-40 text-gray-900 dark:text-white" viewBox="0 0 400 100" preserveAspectRatio="none">
            <path
              className="ecg-line"
              d="M 0 50 L 120 50 L 130 30 L 140 70 L 150 45 L 155 55 L 160 50 L 280 50 L 290 20 L 300 80 L 310 40 L 315 60 L 320 50 L 400 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="header-anim inline-flex items-center gap-2 px-4 py-1.5 bg-physiology/10 text-physiology-dark rounded-full text-xs font-semibold tracking-wide uppercase mb-5">
                2nd Year Ain Shams University <GraduationCap size={14} />
              </div>
              <h1 className="header-anim font-archivo text-5xl lg:text-6xl font-black tracking-tight leading-none mb-3">
                <span className="gradient-title">Endocrine Essay Questions</span>
              </h1>
              <p className="header-sub text-gray-500 dark:text-gray-400 text-lg font-medium max-w-lg leading-relaxed">
                Master the endocrine system through structured, chapter-based essay assessments and clinical cases.
              </p>
            </div>

            <div className="flex items-end gap-4">
              <div className="header-stats flex items-center gap-6 lg:gap-8">
                <div className="text-center">
                  <div className="font-archivo text-3xl font-black text-gray-900 dark:text-white">{chapters.length}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Chapters</div>
                </div>
                <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
                <div className="text-center">
                  <div className="font-archivo text-3xl font-black text-gray-900 dark:text-white">7</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Subjects</div>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* CHAPTER GRID */}
      <div className="max-w-6xl mx-auto px-6 py-10 lg:py-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-physiology to-clinical" />
          <h2 className="font-archivo text-xl font-bold text-gray-900 dark:text-white tracking-tight">Select a Chapter</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="card-animate chapter-card glass-panel rounded-[30px] p-7 cursor-pointer group relative overflow-hidden"
              onClick={() => onSelectChapter(chapter)}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${cornerGradient[chapter.accentColor]} to-transparent rounded-bl-[60px]`} />

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-physiology/15 to-clinical/10 flex items-center justify-center text-xl">
                    {chapter.emoji}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Chapter {chapter.id}
                    </div>
                  </div>
                </div>

                <h3 className={`font-archivo text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-4 ${hoverText[chapter.accentColor]} transition-colors duration-300`}>
                  {chapter.title}
                </h3>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {chapter.subjects.map((s) => (
                    <span
                      key={s.id}
                      className={`badge-pill inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeColors[s.id as SubjectColor]} uppercase tracking-wide`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[s.id as SubjectColor]}`} />
                      {s.name}
                    </span>
                  ))}
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800 mb-4" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                    <Layers size={14} />
                    {chapter.subjects.length} subjects
                  </div>
                  <button
                    className="btn-start inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-full text-xs font-bold tracking-wide"
                    onClick={(e) => { e.stopPropagation(); onSelectChapter(chapter); }}
                  >
                    Start
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RECENT RESULTS */}
        {history.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-biochem to-physiology" />
                <h2 className="font-archivo text-xl font-bold text-gray-900 dark:text-white tracking-tight">Recent Results</h2>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold">{history.length} sessions</span>
              </div>
              <button
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-pathology hover:bg-pathology/5 border border-transparent hover:border-pathology/15 transition-all duration-200"
              >
                <Trash2 size={12} />
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelectHistory && onSelectHistory(r)}
                  className="history-card text-left w-full cursor-pointer bg-white dark:bg-gray-900 rounded-3xl px-5 py-4 border border-gray-100 dark:border-gray-800 flex items-center gap-4 hover:border-gray-300 dark:hover:border-gray-700 hover:scale-[1.01] hover:shadow-md active:scale-[0.99] transition-all duration-300"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                    <span className={`font-archivo text-lg font-black ${pctColor(r.pct)}`}>{r.pct}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-archivo text-sm font-bold text-gray-900 dark:text-white truncate">
                      Ch.{r.chapterId} — {r.subjectName}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                        {r.correct}/{r.total} correct
                      </span>
                      <span className="text-gray-200 dark:text-gray-700">•</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                        <Clock size={10} />
                        {formatTime(r.elapsedSeconds)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-[10px] text-gray-300 dark:text-gray-600 font-medium">{formatDate(r.date)}</div>
                    <Award size={14} className={`mt-1 ml-auto ${pctColor(r.pct)}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SUBJECT LEGEND */}
        <div className="mt-12 p-6 glass-panel rounded-[24px] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={16} className="text-gray-400 dark:text-gray-500" />
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Subject Color Guide</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {(
              [
                ['anatomy', 'Anatomy'],
                ['histology', 'Histology'],
                ['physiology', 'Physiology'],
                ['biochem', 'Biochemistry'],
                ['pathology', 'Pathology'],
                ['pharma', 'Pharmacology'],
                ['clinical', 'Clinical'],
              ] as [SubjectColor, string][]
            ).map(([color, label]) => (
              <div key={color} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${dotColors[color]}`} />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 pb-8 text-center space-y-1">
          <p className="text-xs text-gray-300 dark:text-gray-600 font-medium">
            2nd Year Medical Students • Endocrine System Module
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
