export const mathematicsBlueprint = [
  {
    key: "number",
    label: "Number",
    subtopics: [
      { key: "integers", label: "Integers" },
      { key: "fractions", label: "Fractions" },
      { key: "decimals", label: "Decimals" },
      { key: "percentages", label: "Percentages" },
      { key: "ratio", label: "Ratio" },
      { key: "proportion", label: "Proportion" },
      { key: "indices", label: "Indices" },
      { key: "negative_numbers", label: "Negative Numbers" },
    ],
  },
  {
    key: "algebra",
    label: "Algebra",
    subtopics: [
      { key: "simplifying_expressions", label: "Simplifying Expressions" },
      { key: "substitution", label: "Substitution" },
      { key: "linear_equations", label: "Linear Equations" },
      { key: "formulas", label: "Formulas" },
      { key: "patterns", label: "Patterns" },
      { key: "sequences", label: "Sequences" },
      { key: "worded_algebra", label: "Worded Algebra" },
    ],
  },
  {
    key: "geometry_space",
    label: "Geometry / Space",
    subtopics: [
      { key: "angles", label: "Angles" },
      { key: "triangles", label: "Triangles" },
      { key: "quadrilaterals", label: "Quadrilaterals" },
      { key: "circles_basics", label: "Circles Basics" },
      { key: "perimeter", label: "Perimeter" },
      { key: "area", label: "Area" },
      { key: "volume", label: "Volume" },
      { key: "coordinates", label: "Coordinates" },
      { key: "transformations", label: "Transformations" },
    ],
  },
  {
    key: "measurement",
    label: "Measurement",
    subtopics: [
      { key: "length", label: "Length" },
      { key: "area", label: "Area" },
      { key: "volume", label: "Volume" },
      { key: "time", label: "Time" },
      { key: "speed", label: "Speed" },
      { key: "unit_conversion", label: "Unit Conversion" },
    ],
  },
  {
    key: "statistics_probability",
    label: "Statistics & Probability",
    subtopics: [
      { key: "tables", label: "Tables" },
      { key: "graphs", label: "Graphs" },
      { key: "averages", label: "Averages" },
      { key: "median", label: "Median" },
      { key: "mode", label: "Mode" },
      { key: "probability_basics", label: "Probability Basics" },
    ],
  },
  {
    key: "applied_problem_solving",
    label: "Applied Problem Solving",
    subtopics: [
      { key: "money", label: "Money" },
      { key: "time", label: "Time" },
      { key: "speed", label: "Speed" },
      { key: "percentage_change", label: "Percentage Change" },
      { key: "comparison", label: "Comparison" },
      { key: "logic_word_problems", label: "Logic Word Problems" },
      { key: "multi_step_reasoning", label: "Multi-step Reasoning" },
    ],
  },
] as const;

export const quantitativeReasoningBlueprint = [
  {
    key: "number_reasoning",
    label: "Number Reasoning",
    subtopics: [
      { key: "numerical_logic", label: "Numerical Logic" },
      { key: "arithmetic_deduction", label: "Arithmetic Deduction" },
      { key: "numerical_relationships", label: "Numerical Relationships" },
    ],
  },
  {
    key: "patterns",
    label: "Patterns",
    subtopics: [
      { key: "sequences", label: "Sequences" },
      { key: "next_number", label: "Next Number" },
      { key: "missing_term", label: "Missing Term" },
      { key: "growing_patterns", label: "Growing Patterns" },
      { key: "alternating_patterns", label: "Alternating Patterns" },
    ],
  },
  {
    key: "shapes",
    label: "Shapes",
    subtopics: [
      { key: "visual_patterns", label: "Visual Patterns" },
      { key: "shape_sequences", label: "Shape Sequences" },
      { key: "transformations", label: "Transformations" },
      { key: "symmetry", label: "Symmetry" },
      { key: "rotations", label: "Rotations" },
      { key: "matrices", label: "Matrices" },
    ],
  },
  {
    key: "abstract_reasoning",
    label: "Abstract Reasoning",
    subtopics: [
      { key: "number_patterns", label: "Number Patterns" },
      { key: "logical_relationships", label: "Logical Relationships" },
      { key: "missing_element", label: "Missing Element" },
      { key: "diagram_reasoning", label: "Diagram-based Reasoning" },
    ],
  },
  {
    key: "real_world_quantitative_reasoning",
    label: "Real-world Quantitative Reasoning",
    subtopics: [
      { key: "tables", label: "Tables" },
      { key: "charts", label: "Charts" },
      { key: "data_comparison", label: "Data Comparison" },
      { key: "time", label: "Time" },
      { key: "money", label: "Money" },
      { key: "interpretation", label: "Interpretation" },
    ],
  },
] as const;

export const readingBlueprint = [
  {
    key: "access_retrieve_information",
    label: "Access and Retrieve Information",
    subtopics: [
      { key: "locating_key_details", label: "Locating Key Details" },
      { key: "identifying_stated_facts", label: "Identifying Stated Facts" },
      { key: "finding_supporting_evidence", label: "Finding Supporting Evidence" },
      { key: "recognising_explicit_information", label: "Recognising Explicit Information" },
    ],
  },
  {
    key: "integrate_ideas",
    label: "Integrate Ideas",
    subtopics: [
      { key: "connecting_ideas", label: "Connecting Ideas" },
      { key: "linking_evidence", label: "Linking Evidence" },
      { key: "combining_text_details", label: "Combining Text Details" },
    ],
  },
  {
    key: "interpret_meaning",
    label: "Interpret Meaning",
    subtopics: [
      { key: "inferencing", label: "Inferencing" },
      { key: "understanding_tone", label: "Understanding Tone" },
      { key: "recognising_implied_ideas", label: "Recognising Implied Ideas" },
      { key: "author_purpose", label: "Author Purpose" },
    ],
  },
  {
    key: "reflect_on_texts",
    label: "Reflect on Texts",
    subtopics: [
      { key: "viewpoints", label: "Viewpoints" },
      { key: "comparing_perspectives", label: "Comparing Perspectives" },
      { key: "presentation_of_ideas", label: "Presentation of Ideas" },
    ],
  },
  {
    key: "evaluate_ideas",
    label: "Evaluate Ideas",
    subtopics: [
      { key: "judging_arguments", label: "Judging Arguments" },
      { key: "assessing_evidence", label: "Assessing Evidence" },
      { key: "evaluating_reasoning", label: "Evaluating Reasoning" },
      { key: "effectiveness_of_communication", label: "Effectiveness of Communication" },
    ],
  },
] as const;

export const verbalReasoningBlueprint = [
  {
    key: "word_reasoning",
    label: "Word Reasoning",
    subtopics: [
      { key: "word_meaning", label: "Word Meaning" },
      { key: "word_relationships", label: "Word Relationships" },
      { key: "logical_word_links", label: "Logical Word Links" },
    ],
  },
  {
    key: "concept_reasoning",
    label: "Concept Reasoning",
    subtopics: [
      { key: "classifying_ideas", label: "Classifying Ideas" },
      { key: "recognising_categories", label: "Recognising Categories" },
      { key: "conceptual_relationships", label: "Conceptual Relationships" },
      { key: "meaning_patterns", label: "Patterns in Meaning" },
    ],
  },
  {
    key: "logical_reasoning",
    label: "Logical Reasoning",
    subtopics: [
      { key: "deduction", label: "Deduction" },
      { key: "logical_consequences", label: "Logical Consequences" },
      { key: "verbal_rules", label: "Following Verbal Rules" },
      { key: "best_logical_answer", label: "Best Logical Answer" },
    ],
  },
  {
    key: "verbal_patterns",
    label: "Verbal Patterns",
    subtopics: [
      { key: "analogies", label: "Analogies" },
      { key: "word_associations", label: "Word Associations" },
      { key: "sentence_logic", label: "Sentence Logic" },
      { key: "structured_verbal_relationships", label: "Structured Verbal Relationships" },
    ],
  },
  {
    key: "precision_with_language",
    label: "Precision with Language",
    subtopics: [
      { key: "careful_wording", label: "Careful Wording" },
      { key: "close_meanings", label: "Distinguishing Close Meanings" },
      { key: "exact_language_choice", label: "Exact Language Choice" },
    ],
  },
] as const;