import { ChapterData, Question, SubjectColor, SubjectData, SubQuestion } from './types';
import rawData from '../imports/quiz-data.json';

// ── Raw JSON types ─────────────────────────────────────────────────────────────

type RawSubQuestion = {
  id: string;
  type: 'mcq' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string;
  modelAnswer?: string;
  explanation?: string;
  keyConcept?: string;
};

type RawQuestion = {
  id: number;
  type?: 'mcq' | 'truefalse' | 'matching' | 'essay' | 'case';
  question: string;
  options?: string[];
  correctAnswer?: string;
  pairs?: { premise: string; target: string }[];
  modelAnswer?: string;
  explanation?: string;
  keyConcept?: string;
  subQuestions?: RawSubQuestion[];
};

type RawTopic = {
  topic: string;
  questions: RawQuestion[];
};

type RawChapter = {
  chapterTitle: string;
  topics: RawTopic[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function letterToIndex(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - 65; // A→0, B→1, …
}

function topicToColor(topic: string): SubjectColor {
  const t = topic.toLowerCase();
  if (t.includes('anatomy')) return 'anatomy';
  if (t.includes('histology')) return 'histology';
  if (t.includes('physiology')) return 'physiology';
  if (t.includes('biochem')) return 'biochem';
  if (t.includes('pathology')) return 'pathology';
  if (t.includes('pharmacology') || t.includes('pharma')) return 'pharma';
  if (t.includes('clinical')) return 'clinical';
  return 'physiology'; // fallback
}

const colorToName: Record<SubjectColor, string> = {
  anatomy: 'Anatomy',
  histology: 'Histology',
  physiology: 'Physiology',
  biochem: 'Biochemistry',
  pathology: 'Pathology',
  pharma: 'Pharmacology',
  clinical: 'Clinical',
};

const colorToIcon: Record<SubjectColor, string> = {
  anatomy: 'Bone',
  histology: 'Microscope',
  physiology: 'Activity',
  biochem: 'FlaskConical',
  pathology: 'ShieldAlert',
  pharma: 'Pill',
  clinical: 'Stethoscope',
};

const SUBJECT_ORDER: SubjectColor[] = [
  'anatomy',
  'histology',
  'physiology',
  'biochem',
  'pathology',
  'pharma',
  'clinical',
];

function transformSubQuestion(sq: RawSubQuestion): SubQuestion {
  if (sq.type === 'essay') {
    return {
      id: sq.id,
      type: 'essay',
      text: sq.question,
      modelAnswer: sq.modelAnswer || '',
      explanation: sq.explanation || '',
      keyConcept: sq.keyConcept,
    };
  }

  const options = sq.options || [];
  const idx = sq.correctAnswer ? letterToIndex(sq.correctAnswer) : 0;
  return {
    id: sq.id,
    type: 'mcq',
    text: sq.question,
    options,
    correctIndex: idx >= 0 && idx < options.length ? idx : 0,
    explanation: sq.explanation || '',
    keyConcept: sq.keyConcept,
  };
}

function transformQuestion(q: RawQuestion, color: SubjectColor): Question {
  const rawType = q.type || 'essay'; // default to essay if not specified

  if (rawType === 'case') {
    return {
      id: q.id,
      type: 'case',
      text: q.question,
      lecture: 1,
      subjectColor: color,
      explanation: q.explanation || '',
      keyConcept: q.keyConcept,
      subQuestions: (q.subQuestions || []).map(transformSubQuestion),
    };
  }

  if (rawType === 'matching') {
    return {
      id: q.id,
      type: 'matching',
      text: q.question,
      lecture: 1,
      subjectColor: color,
      pairs: q.pairs || [],
      explanation: q.explanation || '',
      keyConcept: q.keyConcept,
    };
  }

  if (rawType === 'essay') {
    return {
      id: q.id,
      type: 'essay',
      text: q.question,
      lecture: 1,
      subjectColor: color,
      modelAnswer: q.modelAnswer || '',
      explanation: q.explanation || '',
      keyConcept: q.keyConcept,
    };
  }

  const options = q.options || [];
  const idx = q.correctAnswer ? letterToIndex(q.correctAnswer) : 0;
  const isTrueFalse =
    rawType === 'truefalse' ||
    (options.length === 2 &&
      options[0]?.toLowerCase().startsWith('true') &&
      options[1]?.toLowerCase().startsWith('false'));

  return {
    id: q.id,
    type: isTrueFalse ? 'truefalse' : 'mcq',
    text: q.question,
    lecture: 1,
    subjectColor: color,
    options,
    correctIndex: idx >= 0 && idx < options.length ? idx : 0,
    explanation: q.explanation || '',
    keyConcept: q.keyConcept,
  };
}

// ── Chapter metadata ───────────────────────────────────────────────────────────

const CHAPTER_META = [
  {
    id: 1,
    emoji: '🧠',
    page: 1,
    subtitle: 'Pituitary Gland',
    lectureRange: 'Section 1',
    accentColor: 'physiology' as SubjectColor,
  },
  {
    id: 2,
    emoji: '🦋',
    page: 70,
    subtitle: 'Thyroid & Parathyroid',
    lectureRange: 'Section 2',
    accentColor: 'anatomy' as SubjectColor,
  },
  {
    id: 3,
    emoji: '⚡',
    page: 132,
    subtitle: 'Adrenal Gland',
    lectureRange: 'Section 3',
    accentColor: 'pharma' as SubjectColor,
  },
  {
    id: 4,
    emoji: '🫀',
    page: 168,
    subtitle: 'Endocrine Pancreas',
    lectureRange: 'Section 4',
    accentColor: 'biochem' as SubjectColor,
  },
  {
    id: 5,
    emoji: '💉',
    page: 212,
    subtitle: 'Diabetes & Metabolic Disorders',
    lectureRange: 'Section 5',
    accentColor: 'pathology' as SubjectColor,
  },
];

// ── Builder ────────────────────────────────────────────────────────────────────

function buildChapter(
  raw: RawChapter,
  meta: (typeof CHAPTER_META)[number]
): ChapterData {
  const subjectMap = new Map<SubjectColor, Question[]>();

  for (const topicData of raw.topics) {
    const color = topicToColor(topicData.topic);
    if (!subjectMap.has(color)) subjectMap.set(color, []);
    subjectMap
      .get(color)!
      .push(...topicData.questions.map((q) => transformQuestion(q, color)));
  }

  const subjects: SubjectData[] = SUBJECT_ORDER.filter((c) =>
    subjectMap.has(c)
  ).map((color) => ({
    id: color,
    name: colorToName[color],
    iconName: colorToIcon[color],
    lectures: '',
    lectureCount: 1,
    questions: subjectMap.get(color)!,
  }));

  return {
    id: meta.id,
    title: raw.chapterTitle,
    subtitle: meta.subtitle,
    emoji: meta.emoji,
    page: meta.page,
    lectureRange: meta.lectureRange,
    accentColor: meta.accentColor,
    subjects,
  };
}

// ── Exports ────────────────────────────────────────────────────────────────────

export const chapters: ChapterData[] = (
  rawData.chapters as RawChapter[]
).map((raw, i) => buildChapter(raw, CHAPTER_META[i]));
