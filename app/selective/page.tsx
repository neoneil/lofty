import PageCard from "./PageCard";
const rows = [
  {
    old: "Verbal Reasoning",
    current: "Reading and Verbal Reasoning",
    meaning: "语言逻辑、词语关系、推理",
  },
  {
    old: "Reading Comprehension",
    current: "Reading and Verbal Reasoning",
    meaning: "阅读理解、推断、主旨",
  },
  {
    old: "Numerical Reasoning",
    current: "Mathematics and Quantitative Reasoning",
    meaning: "数字规律、逻辑思维",
  },
  {
    old: "Mathematics",
    current: "Mathematics and Quantitative Reasoning",
    meaning: "学校数学 + 应用题",
  },
  {
    old: "Writing",
    current: "Writing",
    meaning: "写作（通常两篇）",
  },
];
export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-(--text-main)">
          Selective School Practice
        </h1>
        <p className="mt-3 max-w-2xl text-(--text-secondary)">
          A simple practice website for Reading, Writing, Maths, and Thinking Skills.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <PageCard
          title="Mathematics and Quantitative Reasoning"
          description="Numerical Reasoning and Mathematics."
          href="/selective/mathAndQuan"
        />
        <PageCard
          title="Reading and Verbal Reasoning"
          description="Reading Comprehension and Verbal Reasoning."
          href="/selective/readingAndVerbal"
        />
        <PageCard
          title="Writing"
          description="Argumentation or Narrative."
          href="/selective/writing"
        />
        <PageCard
          title="supporting practices"
          description="Logic, patterns, reasoning, and critical thinking questions (not included in the exam)."
          href="/selective/supportingPractice"
        />
      </section>

      <section className="bg-[#f3f4f6] px-6 py-16 text-[#24364b] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-medium tracking-tight sm:text-5xl">
            Exam format
          </h1>

          <p className="mb-8 text-xl leading-10 text-[#24364b]">
            The exam takes approximately four hours to administer, including
            registration, exam time and breaks. The exam tasks will take 2 hours
            and 35 minutes to complete.
          </p>

          <p className="mb-6 text-lg leading-8 text-[#24364b]">
            The exam comprises of a series of tests including multiple choice
            questions and written tasks:
          </p>

          <ul className="mb-10 list-disc space-y-2 pl-8 text-lg leading-8 marker:text-[#24364b]">
            <li>Mathematics and Quantitative Reasoning (60 mins)</li>
            <li className="italic">Break (20 mins)</li>
            <li>Reading and Verbal Reasoning (55 mins)</li>
            <li className="italic">Short break (5 mins)</li>
            <li>Writing (40 mins)</li>
          </ul>

          <div className="space-y-8 text-lg leading-8 text-[#24364b]">
            <p>
              Mathematics assesses year-level appropriate mathematical knowledge
              and reasoning, as well as the application of Mathematics to
              real-world contexts.
            </p>

            <p>
              Quantitative Reasoning assesses the ability to think and reason
              using numbers, patterns, and shapes, in both abstract and real-world
              contexts.
            </p>

            <p>
              Reading assesses the ability to access and retrieve information and
              to integrate, interpret, reflect on and evaluate ideas communicated
              in texts.
            </p>

            <p>
              Verbal Reasoning assesses the ability to think and reason using
              words, concepts and logic.
            </p>

            <p>
              Writing assesses the ability to convey ideas in precise language
              with ideas organised coherently. The writing test consists of two
              tasks.
            </p>

            <p>The exam is designed to challenge candidates.</p>
          </div>
        </div>
      </section>
      <section className="w-full py-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-2xl font-semibold text-slate-800 sm:text-3xl">
            维州 SEHS（Year 9）考试：旧版 vs 现在官方版
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700 sm:text-base">
                    旧版常见说法（培训机构 / 旧资料）
                  </th>
                  <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700 sm:text-base">
                    现在官方 ACER 写法
                  </th>
                  <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700 sm:text-base">
                    本质考什么
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="border-b border-slate-100 px-6 py-4 text-sm text-slate-800 sm:text-base">
                      {row.old}
                    </td>
                    <td className="border-b border-slate-100 px-6 py-4 text-sm text-slate-800 sm:text-base">
                      {row.current}
                    </td>
                    <td className="border-b border-slate-100 px-6 py-4 text-sm text-slate-800 sm:text-base">
                      {row.meaning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="w-full py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              What is tested in Mathematics and Quantitative Reasoning
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Based on the official ACER description for the Victorian Selective Entry High School exam.
              Mathematics focuses on year-level appropriate mathematical knowledge and reasoning, while
              Quantitative Reasoning focuses on numbers, patterns, and shapes in abstract and real-world contexts.
            </p>
          </div>

          <div className="grid gap-8 xl:grid-cols-2">
            {/* Mathematics table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h3 className="text-xl font-semibold text-slate-800">
                  Mathematics
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Year-level appropriate mathematical knowledge and reasoning, including application to real-world contexts.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700">
                        Category
                      </th>
                      <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700">
                        What it includes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Number
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        integers, fractions, decimals, percentages, ratio, proportion, indices, negative numbers
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Algebra
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        simplifying expressions, substitution, linear equations, formulas, patterns, sequences, worded algebra
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Geometry / Space
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        angles, triangles, quadrilaterals, circles basics, perimeter, area, volume, coordinates, transformations
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Measurement
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        length, area, volume, time, speed, units conversion
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Statistics &amp; Probability
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        tables, graphs, averages, median, mode, probability basics
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        Applied Problem Solving
                      </td>
                      <td className="px-6 py-4 text-sm leading-7 text-slate-700">
                        money, time, speed, percentage change, comparison, logic word problems, multi-step reasoning
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quantitative Reasoning table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h3 className="text-xl font-semibold text-slate-800">
                  Quantitative Reasoning
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Numbers, patterns, and shapes in both abstract and real-world contexts.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700">
                        Category
                      </th>
                      <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700">
                        What it includes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Number Reasoning
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        numerical logic, arithmetic deduction, numerical relationships
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Patterns
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        sequences, next number, missing term, growing patterns, alternating patterns
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Shapes
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        visual patterns, shape sequences, transformations, symmetry, rotations, matrices
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Abstract Reasoning
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        number patterns, logical relationships, missing element problems, diagram-based reasoning
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        Real-world Quantitative Reasoning
                      </td>
                      <td className="px-6 py-4 text-sm leading-7 text-slate-700">
                        tables, charts, data comparison, time, money, interpretation
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              What is tested in Reading and Verbal Reasoning
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              This section focuses on reading comprehension, interpretation, verbal logic,
              and reasoning with words, concepts, and ideas.
            </p>
          </div>

          <div className="grid gap-8 xl:grid-cols-2">
            {/* Reading table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h3 className="text-xl font-semibold text-slate-800">
                  Reading
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Focuses on understanding, interpreting, and evaluating texts.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700">
                        Category
                      </th>
                      <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700">
                        What it includes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Access and Retrieve Information
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        locating key details, identifying stated facts, finding supporting evidence, recognising explicit information
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Integrate Ideas
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        connecting ideas across a passage, linking evidence, combining details from different parts of a text
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Interpret Meaning
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        inferring meaning, understanding tone, recognising implied ideas, interpreting author purpose
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Reflect on Texts
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        considering viewpoints, comparing perspectives, thinking about how ideas are presented
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        Evaluate Ideas
                      </td>
                      <td className="px-6 py-4 text-sm leading-7 text-slate-700">
                        judging the strength of arguments, assessing evidence, evaluating reasoning, analysing how effectively ideas are communicated
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verbal Reasoning table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h3 className="text-xl font-semibold text-slate-800">
                  Verbal Reasoning
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Focuses on reasoning with words, concepts, and logic.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700">
                        Category
                      </th>
                      <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700">
                        What it includes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Word Reasoning
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        understanding word meaning, recognising relationships between words, identifying logical word links
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Concept Reasoning
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        classifying ideas, recognising categories, understanding conceptual relationships, identifying patterns in meaning
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Logical Reasoning
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        deduction, identifying logical consequences, following verbal rules, selecting the best logical answer
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                        Verbal Patterns
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                        analogies, word associations, sentence logic, structured verbal relationships
                      </td>
                    </tr>

                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        Precision with Language
                      </td>
                      <td className="px-6 py-4 text-sm leading-7 text-slate-700">
                        careful reading of wording, distinguishing close meanings, choosing answers based on exact language rather than guesswork
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              What is tested in Writing
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              The writing test focuses on expressing ideas clearly, using precise language,
              and organising ideas coherently across two writing tasks.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-xl font-semibold text-slate-800">
                Writing
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Two writing tasks completed in 40 minutes.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700">
                      Category
                    </th>
                    <th className="border-b border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700">
                      What it includes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="align-top transition hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                      Task Types
                    </td>
                    <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                      two writing tasks completed under timed conditions; students should be prepared to respond appropriately to different writing purposes and prompts
                    </td>
                  </tr>

                  <tr className="align-top transition hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                      Clear Ideas
                    </td>
                    <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                      presenting relevant ideas, staying on topic, developing a response that directly answers the prompt
                    </td>
                  </tr>

                  <tr className="align-top transition hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                      Precise Language
                    </td>
                    <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                      choosing accurate vocabulary, expressing meaning clearly, avoiding vague or repetitive wording
                    </td>
                  </tr>

                  <tr className="align-top transition hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                      Coherent Organisation
                    </td>
                    <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                      structuring writing logically, grouping ideas effectively, using a clear beginning, middle, and ending
                    </td>
                  </tr>

                  <tr className="align-top transition hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-800">
                      Control and Accuracy
                    </td>
                    <td className="border-b border-slate-100 px-6 py-4 text-sm leading-7 text-slate-700">
                      sentence control, grammar, punctuation, and spelling that support clear communication
                    </td>
                  </tr>

                  <tr className="align-top transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      What to Watch For
                    </td>
                    <td className="px-6 py-4 text-sm leading-7 text-slate-700">
                      understand the task quickly, manage time across both pieces, organise ideas before writing, and keep language precise and purposeful
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>



    </main>
  );
}