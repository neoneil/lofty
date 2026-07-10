const bookNumber = Number(process.argv[2] ?? 15);
const topicType = Number(process.argv[3] ?? 1);
const url = new URL("https://www.winielts.com/api/ieltsCategory/sectionList");
url.searchParams.set("page", "1");
url.searchParams.set("topicType", String(topicType));
url.searchParams.set("camNum", String(bookNumber));

const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0", referer: "https://www.winielts.com/question/category" } });
const json = await res.json();
const rows = Array.isArray(json.data) ? json.data : json.data?.list ?? [];

console.log(`book=${bookNumber} topicType=${topicType} count=${rows.length}`);
for (const [index, row] of rows.entries()) {
  console.log(JSON.stringify({
    index,
    id: row.id,
    keys: Object.keys(row),
    offerTitle: row.offerTitle,
    title: row.title,
    serialNumber: row.serialNumber,
    testNum: row.testNum,
    paperNum: row.paperNum,
    sectionNum: row.sectionNum,
    section: row.section,
    part: row.part,
    partNum: row.partNum,
  }, null, 2));
}
