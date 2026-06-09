import fs from 'fs';
import path from 'path';

const FILES_TO_UPDATE = [
  'src/imports/quiz-data.json',
  'src/imports/Endocrine essay final JSON.json'
];

function reorganizeFile(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  console.log(`Reorganizing ${filePath}...`);
  const data = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  // 1. Move Pituitary Case (ID 67)
  let pitCase = null;
  data.chapters.forEach(ch => {
    ch.topics.forEach(tp => {
      tp.questions = tp.questions.filter(q => {
        if (q.id === 67) {
          pitCase = q;
          console.log(`Found Pituitary Case ID 67 in topic "${tp.topic}"`);
          return false;
        }
        return true;
      });
    });
  });

  if (pitCase) {
    const pitCh = data.chapters.find(ch => ch.chapterTitle === 'Pituitary Gland');
    let pitPathology = pitCh.topics.find(tp => tp.topic === 'Pituitary Pathology');
    if (!pitPathology) {
      pitPathology = { topic: 'Pituitary Pathology', questions: [] };
      pitCh.topics.push(pitPathology);
    }
    pitPathology.questions.push(pitCase);
    console.log(`Moved Pituitary Case ID 67 to "Pituitary Pathology"`);
  }

  // 2. Move Parathyroid Cases (ID 30 and ID 79)
  const paraCases = [];
  data.chapters.forEach(ch => {
    ch.topics.forEach(tp => {
      tp.questions = tp.questions.filter(q => {
        if (q.id === 30 || q.id === 79) {
          paraCases.push(q);
          console.log(`Found Parathyroid Case ID ${q.id} in topic "${tp.topic}"`);
          return false;
        }
        return true;
      });
    });
  });

  if (paraCases.length > 0) {
    const thyroidCh = data.chapters.find(ch => ch.chapterTitle === 'Thyroid & Parathyroid Glands');
    let paraPathology = thyroidCh.topics.find(tp => tp.topic === 'Parathyroid Pathology');
    if (!paraPathology) {
      paraPathology = { topic: 'Parathyroid Pathology', questions: [] };
      thyroidCh.topics.push(paraPathology);
    }
    paraPathology.questions.push(...paraCases);
    console.log(`Moved Parathyroid Cases ${paraCases.map(c => c.id).join(', ')} to "Parathyroid Pathology"`);
  }

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

  // Save back to file
  fs.writeFileSync(absolutePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${filePath} successfully!\n`);
}

FILES_TO_UPDATE.forEach(reorganizeFile);
