import fs from 'fs';
import path from 'path';

const FILES_TO_UPDATE = [
  'src/imports/quiz-data.json',
  'src/imports/Endocrine essay+patho.json'
];

const QUESTION_MAP = {
  79: { targetChapter: 'Pituitary Gland', targetTopic: 'Pituitary Pathology' },
  80: { targetChapter: 'Thyroid & Parathyroid Glands', targetTopic: 'Thyroid Pathology' },
  81: { targetChapter: 'Thyroid & Parathyroid Glands', targetTopic: 'Thyroid Pathology' },
  82: { targetChapter: 'Thyroid & Parathyroid Glands', targetTopic: 'Thyroid Pathology' },
  83: { targetChapter: 'Thyroid & Parathyroid Glands', targetTopic: 'Thyroid Pathology' },
  84: { targetChapter: 'Thyroid & Parathyroid Glands', targetTopic: 'Thyroid Pathology' },
  85: { targetChapter: 'Thyroid & Parathyroid Glands', targetTopic: 'Thyroid Pathology' },
  86: { targetChapter: 'Thyroid & Parathyroid Glands', targetTopic: 'Thyroid Pathology' },
  87: { targetChapter: 'Thyroid & Parathyroid Glands', targetTopic: 'Thyroid Pathology' },
  88: { targetChapter: 'Thyroid & Parathyroid Glands', targetTopic: 'Thyroid Pathology' },
  89: { targetChapter: 'Thyroid & Parathyroid Glands', targetTopic: 'Thyroid Pathology' },
  90: { targetChapter: 'Thyroid & Parathyroid Glands', targetTopic: 'Thyroid Pathology' },
  91: { targetChapter: 'Thyroid & Parathyroid Glands', targetTopic: 'Parathyroid Pathology' },
  92: { targetChapter: 'Adrenal (Suprarenal) Gland', targetTopic: 'Adrenal Pathology' },
  93: { targetChapter: 'Adrenal (Suprarenal) Gland', targetTopic: 'Adrenal Pathology' },
  94: { targetChapter: 'Adrenal (Suprarenal) Gland', targetTopic: 'Adrenal Pathology' },
  95: { targetChapter: 'Adrenal (Suprarenal) Gland', targetTopic: 'Adrenal Pathology' }
};

function reorganizeFile(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  console.log(`Reorganizing ${filePath}...`);
  const data = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  // 1. Extract the questions we need to move
  const questionsToMove = [];
  
  data.chapters.forEach(ch => {
    ch.topics.forEach(tp => {
      const remainingQuestions = [];
      tp.questions.forEach(q => {
        if (QUESTION_MAP[q.id]) {
          questionsToMove.push(q);
          console.log(`Extracting Q ID ${q.id} from topic "${tp.topic}"`);
        } else {
          remainingQuestions.push(q);
        }
      });
      tp.questions = remainingQuestions;
    });
  });

  // 2. Put the questions in their target chapters & topics
  questionsToMove.forEach(q => {
    const mapping = QUESTION_MAP[q.id];
    const targetCh = data.chapters.find(ch => ch.chapterTitle === mapping.targetChapter);
    if (!targetCh) {
      console.error(`Target chapter not found: "${mapping.targetChapter}"`);
      return;
    }
    
    let targetTp = targetCh.topics.find(tp => tp.topic === mapping.targetTopic);
    if (!targetTp) {
      targetTp = {
        topic: mapping.targetTopic,
        questions: []
      };
      targetCh.topics.push(targetTp);
      console.log(`Created topic "${mapping.targetTopic}" in "${mapping.targetChapter}"`);
    }
    
    targetTp.questions.push(q);
    console.log(`Moved Q ID ${q.id} to "${mapping.targetChapter}" -> "${mapping.targetTopic}"`);
  });

  // 3. Remove empty topics
  data.chapters.forEach(ch => {
    ch.topics = ch.topics.filter(tp => {
      if (tp.questions.length === 0) {
        console.log(`Removing empty topic "${tp.topic}" in "${ch.chapterTitle}"`);
        return false;
      }
      return true;
    });
  });

  // 4. Recalculate total questions
  let totalQuestions = 0;
  data.chapters.forEach(ch => {
    ch.topics.forEach(tp => {
      totalQuestions += tp.questions.length;
    });
  });
  data.totalQuestions = totalQuestions;
  console.log(`Total questions in ${filePath}: ${totalQuestions}`);

  // Write back to file
  fs.writeFileSync(absolutePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${filePath} successfully!\n`);
}

FILES_TO_UPDATE.forEach(reorganizeFile);
