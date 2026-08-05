import { readFileSync, writeFileSync } from "node:fs";

import matter from "gray-matter";

const titleByPart = new Map([
  ["1-1", "William Henry Perkin"],
  ["1-2", "Is There Anybody Out There?"],
  ["1-3", "The History of the Tortoise"],
  ["2-1", "Hearing Impairment"],
  ["2-2", "Venus in Transit"],
  ["2-3", "A Neuroscientist Reveals How to Think Differently"],
  ["3-1", "Attitudes to Language"],
  ["3-2", "Tidal Power"],
  ["3-3", "Information Theory - The Big Idea"],
  ["4-1", "The Life and Work of Marie Curie"],
  ["4-2", "Young Children's Sense of Identity"],
  ["4-3", "The Development of Museums"],
]);

function cleanArticleHtml(value) {
  return value
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/\s(?:style|class)=("[^"]*"|'[^']*')/gi, "")
    .replace(/<\/b>\s*<\/p>/gi, "</p>")
    .replace(/(?:\s*<br\s*\/?>\s*){3,}/gi, "<br/><br/>")
    .replace(/\s*<br\s*\/?>\s*/gi, "<br/>")
    .replace(/^(?:<br\/>)+/i, "")
    .replace(/^\s+|\s+$/g, "");
}

function replacePassageTitle(frontmatter, title) {
  return frontmatter.replace(/^passage_title:.*$/m, `passage_title: "${title.replace(/"/g, '\\"')}"`);
}

function splitFrontmatter(source) {
  const match = source.match(/^(---\n[\s\S]*?\n---\n?)([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter block.");
  return { frontmatter: match[1], content: match[2] };
}

for (let testNumber = 1; testNumber <= 4; testNumber += 1) {
  for (let partNumber = 1; partNumber <= 3; partNumber += 1) {
    const filePath = `content/ielts/cambridge/9/test${testNumber}/reading/part${partNumber}.md`;
    const source = readFileSync(filePath, "utf8");
    const parsed = matter(source);
    const rawData = JSON.parse(parsed.data.section_raw_data_json);
    const article = cleanArticleHtml(rawData.detail?.article || "");
    if (!article) throw new Error(`Missing article for ${filePath}`);

    const title = titleByPart.get(`${testNumber}-${partNumber}`);
    if (!title) throw new Error(`Missing title for ${filePath}`);

    const { frontmatter } = splitFrontmatter(source);
    const nextFrontmatter = replacePassageTitle(frontmatter, title);
    writeFileSync(filePath, `${nextFrontmatter.trimEnd()}\n\n${article}\n`, "utf8");
    console.log(`Updated ${filePath}: ${title} (${article.length} chars)`);
  }
}
