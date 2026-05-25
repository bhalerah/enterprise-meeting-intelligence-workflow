const fs = require("fs");
const path = require("path");

function loadKnowledgeDocs() {
  const knowledgeDir = path.join(__dirname, "../knowledge");

  return fs.readdirSync(knowledgeDir).map((fileName) => {
    const filePath = path.join(knowledgeDir, fileName);
    return {
      fileName,
      content: fs.readFileSync(filePath, "utf8"),
    };
  });
}

function retrieveRelevantContext(query) {
  const docs = loadKnowledgeDocs();
  const queryWords = query.toLowerCase().split(/\W+/);

  const scoredDocs = docs.map((doc) => {
    const content = doc.content.toLowerCase();
    const score = queryWords.reduce((total, word) => {
      return total + (content.includes(word) ? 1 : 0);
    }, 0);

    return {
      ...doc,
      score,
    };
  });

  return scoredDocs
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((doc) => `Source: ${doc.fileName}\n${doc.content}`)
    .join("\n\n");
}

module.exports = { retrieveRelevantContext };