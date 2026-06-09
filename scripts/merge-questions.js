import fs from 'fs';
import path from 'path';

// Get command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Error: Please provide the path to the new questions JSON file.');
  console.log('Usage: node scripts/merge-questions.js <path-to-new-json-file>');
  process.exit(1);
}

const newFilePath = path.resolve(args[0]);
const mainFilePath = path.resolve('src/imports/quiz-data.json');

if (!fs.existsSync(newFilePath)) {
  console.error(`Error: The file "${newFilePath}" does not exist.`);
  process.exit(1);
}

if (!fs.existsSync(mainFilePath)) {
  console.error(`Error: The main database "${mainFilePath}" could not be found.`);
  process.exit(1);
}

try {
  // Read both files
  const mainData = JSON.parse(fs.readFileSync(mainFilePath, 'utf8'));
  const newData = JSON.parse(fs.readFileSync(newFilePath, 'utf8'));

  // Helper to find the maximum question ID currently in the main database
  let maxId = 0;
  const findMaxId = (data) => {
    if (data.chapters) {
      data.chapters.forEach(ch => {
        if (ch.topics) {
          ch.topics.forEach(tp => {
            if (tp.questions) {
              tp.questions.forEach(q => {
                if (q.id && typeof q.id === 'number') {
                  maxId = Math.max(maxId, q.id);
                }
              });
            }
          });
        }
      });
    }
  };
  findMaxId(mainData);
  console.log(`Current maximum Question ID in main database: ${maxId}`);

  // Loop through chapters in the new database
  if (newData.chapters) {
    newData.chapters.forEach(newCh => {
      // Find or create chapter in mainData
      let mainCh = mainData.chapters.find(ch => ch.chapterTitle === newCh.chapterTitle);
      if (!mainCh) {
        mainCh = {
          chapterTitle: newCh.chapterTitle,
          topics: []
        };
        mainData.chapters.push(mainCh);
        console.log(`Created new chapter: "${newCh.chapterTitle}"`);
      }

      // Loop through topics in the new chapter
      if (newCh.topics) {
        newCh.topics.forEach(newTp => {
          // Find or create topic in mainCh
          let mainTp = mainCh.topics.find(tp => tp.topic === newTp.topic);
          if (!mainTp) {
            mainTp = {
              topic: newTp.topic,
              questions: []
            };
            mainCh.topics.push(mainTp);
            console.log(`Created new topic: "${newTp.topic}" inside "${newCh.chapterTitle}"`);
          }

          // Append questions and re-assign IDs
          if (newTp.questions) {
            newTp.questions.forEach(newQ => {
              maxId++;
              const updatedQ = {
                ...newQ,
                id: maxId
              };
              
              // Handle subQuestions inside case studies
              if (updatedQ.type === 'case' && updatedQ.subQuestions) {
                updatedQ.subQuestions = updatedQ.subQuestions.map((subQ, idx) => {
                  const suffix = String.fromCharCode(97 + idx); // 'a', 'b', 'c', etc.
                  return {
                    ...subQ,
                    id: `${maxId}_${suffix}`
                  };
                });
              }

              // fillblank questions don't need sub-ID changes — blanks[] are just strings
              // Both 'question' and 'text' field names are supported by data.ts

              mainTp.questions.push(updatedQ);
              const label = (updatedQ.question || updatedQ.text || '(no text)').substring(0, 50);
              console.log(`Added question ID ${maxId} [${updatedQ.type}]: "${label}..."`);
            });
          }
        });
      }
    });
  }

  // Recalculate total questions
  let totalQuestions = 0;
  mainData.chapters.forEach(ch => {
    if (ch.topics) {
      ch.topics.forEach(tp => {
        if (tp.questions) {
          totalQuestions += tp.questions.length;
        }
      });
    }
  });
  mainData.totalQuestions = totalQuestions;
  console.log(`Updated totalQuestions count to: ${totalQuestions}`);

  // Write back to main file
  fs.writeFileSync(mainFilePath, JSON.stringify(mainData, null, 2), 'utf8');
  console.log('Successfully merged and saved changes to src/imports/quiz-data.json!');

} catch (err) {
  console.error('An error occurred during merging:', err);
  process.exit(1);
}
