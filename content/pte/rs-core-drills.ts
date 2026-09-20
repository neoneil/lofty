export type StaticRsCoreDrill = {
  id: string;
  question_text: string;
  group: string;
};

const RAW_RS_SENTENCES = String.raw`
The library will remain open until midnight during the examination period.
Students should submit their assignments through the online learning system.
The lecture has been moved to a larger room this afternoon.
Please check the university website for the latest course information.
All students are expected to attend the orientation session next Monday.
The professor will discuss the assignment requirements at the next lecture.
You can borrow these books from the main university library.
The student service centre is located opposite the administration building.
Please bring your student card when you enter the examination room.
The tutorial gives students an opportunity to discuss difficult concepts.
International students can receive additional support from the language centre.
The deadline for this assignment has been extended until Friday.
Students are encouraged to participate actively in classroom discussions.
The university offers several scholarships for outstanding international students.
You should contact your course coordinator if you have any questions.
The new semester begins on the first Monday of September.
Attendance at laboratory sessions is compulsory for all science students.
The cafeteria is usually crowded between twelve and two in the afternoon.
Lecture recordings are available on the university's online learning platform.
The final examination accounts for forty percent of the course grade.
Academic research requires careful analysis of reliable evidence.
The researchers collected data from more than five hundred participants.
Students should evaluate the evidence before reaching a conclusion.
The results of the experiment were published in an academic journal.
A good research question should be clear and specific.
The study examines the relationship between education and economic development.
Researchers must explain the methods used to collect their data.
The evidence does not fully support the original hypothesis.
Further research is needed to understand the long-term effects.
The sample was divided into two groups for comparison.
Statistical analysis can reveal patterns that are difficult to observe directly.
The research findings should be interpreted with considerable caution.
Students need to distinguish between reliable sources and personal opinions.
The experiment was repeated several times to improve the accuracy of the results.
Academic writing requires both clear arguments and supporting evidence.
The literature review identifies important gaps in previous research.
Researchers often use questionnaires to collect information from large populations.
The quality of the data can significantly affect the final conclusion.
The study provides useful evidence for future academic research.
Critical thinking is an essential part of independent learning.
Consumer confidence has a significant influence on economic growth.
The company plans to expand its operations into international markets.
Effective management requires clear communication between different departments.
Rising interest rates can reduce consumer spending and business investment.
The marketing team will present its new strategy tomorrow morning.
Small businesses often face greater financial risks during economic downturns.
The company has invested heavily in developing new products.
Market research helps businesses understand the needs of their customers.
Economic growth depends partly on productivity and technological development.
Managers should consider both short-term costs and long-term benefits.
The organisation introduced a new system to improve workplace efficiency.
International trade creates opportunities for both businesses and consumers.
The demand for skilled workers has increased significantly in recent years.
Successful companies usually respond quickly to changing market conditions.
The government is considering new measures to encourage business investment.
Customer satisfaction is an important indicator of business performance.
The financial report shows a gradual increase in operating costs.
Good leadership can improve employee motivation and organisational performance.
Competition encourages companies to develop better products and services.
Economic uncertainty can make long-term investment decisions more difficult.
Scientific theories must be supported by reliable experimental evidence.
Water changes from a liquid to a gas when it evaporates.
Scientists use controlled experiments to test their predictions.
The discovery has changed our understanding of the natural world.
Accurate measurement is essential for producing reliable scientific results.
Social behaviour is influenced by both cultural and economic factors.
Population growth can create significant pressure on public services.
Researchers are studying the effects of social media on young people.
Migration has contributed to cultural diversity in many modern societies.
Social inequality remains an important issue in many developing countries.
Climate change is affecting ecosystems in many parts of the world.
Renewable energy can reduce our dependence on fossil fuels.
Rising temperatures may increase the frequency of extreme weather events.
Governments are introducing new policies to reduce carbon emissions.
Protecting natural habitats is essential for maintaining biological diversity.
Regular physical activity can reduce the risk of several diseases.
The human brain requires a constant supply of oxygen and energy.
Researchers are developing new treatments for common chronic diseases.
A balanced diet is essential for maintaining good physical health.
The immune system protects the body against harmful microorganisms.
Students learn more effectively when they actively engage with new information.
Motivation can have a significant effect on academic performance.
Children develop language skills rapidly during the early years of life.
Effective feedback can help students identify areas for improvement.
Psychologists study how people think, behave, and respond to their environment.
Artificial intelligence is transforming the way many industries operate.
Digital technology allows people to access information almost instantly.
Computer systems must be regularly updated to improve security.
Advances in technology have significantly changed modern communication.
Large amounts of information can now be stored in the cloud.
Historical documents provide valuable information about past societies.
Language changes gradually as societies and cultures develop.
Literature can provide important insights into different historical periods.
Cultural traditions are often passed from one generation to another.
The novel reflects the social and political conditions of its time.
Modern agriculture depends increasingly on advanced technology and machinery.
Farmers must adapt their methods to changing environmental conditions.
Food production is strongly affected by water availability and soil quality.
Organic farming has become increasingly popular among some consumers.
Improved agricultural practices can increase productivity while reducing environmental damage.
New legislation must be approved before it can take effect.
Public policy can have significant economic and social consequences.
The legal system is designed to protect individual rights.
Governments often consult experts before introducing major policy changes.
The new regulations will affect both businesses and individual consumers.
Most of the population is concentrated in large urban areas.
Rapid urbanisation has increased the demand for housing and transport.
Geographic location can strongly influence patterns of economic development.
Population density varies considerably between different regions of the country.
Modern cities require efficient public transport to support growing populations.
Scientists have discovered thousands of planets beyond our solar system.
The Earth takes approximately one year to orbit the Sun.
Modern telescopes allow astronomers to observe extremely distant galaxies.
Space exploration has greatly improved our understanding of the universe.
The possibility of life on other planets remains an important research question.
Public transport is usually more convenient during peak hours.
The meeting has been postponed until Thursday afternoon.
Please remember to bring your identification with you tomorrow.
The restaurant is located within walking distance of the station.
Most people prefer to receive important information in advance.
`;

const GROUPS = [
  { name: "校园与课程", count: 20 },
  { name: "学术研究", count: 20 },
  { name: "商业与经济", count: 20 },
  { name: "自然科学", count: 5 },
  { name: "社会研究", count: 5 },
  { name: "环境", count: 5 },
  { name: "健康与医学", count: 5 },
  { name: "教育与心理", count: 5 },
  { name: "科技", count: 5 },
  { name: "历史与文化", count: 5 },
  { name: "农业", count: 5 },
  { name: "法律与政策", count: 5 },
  { name: "地理与城市", count: 5 },
  { name: "天文与太空", count: 5 },
  { name: "日常表达", count: 5 },
] as const;

const sentences = RAW_RS_SENTENCES.trim().split("\n").map((sentence) => sentence.trim()).filter(Boolean);
if (sentences.length !== 120) throw new Error(`Expected 120 static RS sentences, received ${sentences.length}.`);

function getGroup(index: number) {
  let offset = 0;
  for (const group of GROUPS) {
    offset += group.count;
    if (index < offset) return group.name;
  }
  return "综合训练";
}

export const RS_CORE_DRILLS: StaticRsCoreDrill[] = sentences.map((questionText, index) => ({
  id: `32000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  question_text: questionText,
  group: getGroup(index),
}));

export const RS_CORE_DRILL_IDS = RS_CORE_DRILLS.map((question) => question.id);

export function getRsCoreDrill(id: string) {
  return RS_CORE_DRILLS.find((question) => question.id === id) ?? null;
}
