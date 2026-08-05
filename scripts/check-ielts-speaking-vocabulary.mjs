import { readFileSync } from "node:fs";
import path from "node:path";

const DOCUMENT_PATH = path.join(process.cwd(), "content", "ielts", "vocabulary", "speaking", "classified-vocabulary.json");
const document = JSON.parse(readFileSync(DOCUMENT_PATH, "utf8"));
const rows = document.topics.map((topic) => {
  const done = topic.items.filter((item) => item.translation).length;
  return {
    code: topic.topicCode,
    title: topic.title,
    done,
    total: topic.items.length,
    missing: topic.items.length - done,
  };
});
const total = rows.reduce((sum, row) => sum + row.total, 0);
const done = rows.reduce((sum, row) => sum + row.done, 0);

console.log(JSON.stringify({
  total,
  done,
  missing: total - done,
  rows,
}, null, 2));
