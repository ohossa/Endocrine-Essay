import fs from 'fs';
import path from 'path';

const mainFilePath = path.resolve('src/imports/quiz-data.json');
const newFilePath = path.resolve('New endocrine essay Qbank.json');

if (!fs.existsSync(mainFilePath)) {
  console.error(`Error: Main database "${mainFilePath}" not found.`);
  process.exit(1);
}

if (!fs.existsSync(newFilePath)) {
  console.error(`Error: New Qbank file "${newFilePath}" not found.`);
  process.exit(1);
}

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

try {
  const mainData = JSON.parse(fs.readFileSync(mainFilePath, 'utf8'));
  const newData = JSON.parse(fs.readFileSync(newFilePath, 'utf8'));

  // 1. Gather all existing normalized question texts
  const existingNormTexts = new Set();
  let originalCount = 0;

  mainData.chapters.forEach(ch => {
    if (ch.topics) {
      ch.topics.forEach(tp => {
        if (tp.questions) {
          tp.questions.forEach(q => {
            originalCount++;
            const txt = q.question || q.text;
            if (txt) {
              existingNormTexts.add(normalizeText(txt));
            }
          });
        }
      });
    }
  });

  console.log(`Original questions in main database: ${originalCount}`);

  // Helpers for matching chapters/topics
  const getChapterKey = (title) => title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const getTopicKey = (topic) => topic.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  let addedCount = 0;
  let duplicateCount = 0;

  // 2. Loop through new chapters & topics, append unique questions
  if (newData.chapters) {
    newData.chapters.forEach(newCh => {
      // Find matching chapter in main database
      let mainCh = mainData.chapters.find(ch => getChapterKey(ch.chapterTitle) === getChapterKey(newCh.chapterTitle));
      if (!mainCh) {
        mainCh = {
          chapterTitle: newCh.chapterTitle,
          topics: []
        };
        mainData.chapters.push(mainCh);
        console.log(`Created new chapter: "${newCh.chapterTitle}"`);
      }

      if (newCh.topics) {
        newCh.topics.forEach(newTp => {
          // Find matching topic in main chapter
          let mainTp = mainCh.topics.find(tp => getTopicKey(tp.topic) === getTopicKey(newTp.topic));
          if (!mainTp) {
            mainTp = {
              topic: newTp.topic,
              questions: []
            };
            mainCh.topics.push(mainTp);
            console.log(`Created new topic: "${newTp.topic}" inside "${newCh.chapterTitle}"`);
          }

          if (newTp.questions) {
            newTp.questions.forEach(newQ => {
              const txt = newQ.question || newQ.text;
              const norm = normalizeText(txt);

              if (norm && existingNormTexts.has(norm)) {
                duplicateCount++;
              } else {
                // Not a duplicate, add to main topic
                mainTp.questions.push({ ...newQ });
                if (norm) {
                  existingNormTexts.add(norm);
                }
                addedCount++;
              }
            });
          }
        });
      }
    });
  }

  console.log(`\nMerge Summary:`);
  console.log(`- Duplicates found & skipped: ${duplicateCount}`);
  console.log(`- New unique questions added: ${addedCount}`);

  // 3. Re-assign all IDs starting from 1 to N to guarantee sequential cleanliness
  let currentId = 0;
  mainData.chapters.forEach(ch => {
    if (ch.topics) {
      ch.topics.forEach(tp => {
        if (tp.questions) {
          tp.questions.forEach(q => {
            currentId++;
            q.id = currentId;

            // Fix subQuestion IDs if it's a clinical case
            if (q.type === 'case' && q.subQuestions) {
              q.subQuestions.forEach((subQ, idx) => {
                const suffix = String.fromCharCode(97 + idx); // a, b, c, etc.
                subQ.id = `${currentId}_${suffix}`;
              });
            }
          });
        }
      });
    }
  });

  mainData.totalQuestions = currentId;
  console.log(`- Final total questions count: ${currentId}`);

  // Write merged output back
  fs.writeFileSync(mainFilePath, JSON.stringify(mainData, null, 2), 'utf8');
  console.log(`\nSuccessfully merged and saved changes to: ${mainFilePath}`);

} catch (err) {
  console.error('An error occurred during unique merging:', err);
  process.exit(1);
}
