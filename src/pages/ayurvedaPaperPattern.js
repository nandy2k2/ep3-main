export const ayurvedaPatternRows = [20, 8, 4].flatMap((count, sectionIndex) => Array.from({ length: count }, (_, index) => ({
  section: `Section ${sectionIndex + 1}`,
  question: `${sectionIndex + 1}.${index + 1}`,
  questiontype: sectionIndex === 0 ? "MCQ" : "Descriptive",
  marks: [1, 5, 10][sectionIndex],
  group: "", subquestion: "", order: index + 1,
  instructions: "Answer all questions."
})));

export const fixedAyurvedaSections = (source = []) => [20, 8, 4].map((count, s) => ({
  ...(source[s] || {}), title: `Section ${s + 1}`, marks: count * [1, 5, 10][s],
  questions: Array.from({ length: count }, (_, q) => ({
    ...(source[s]?.questions?.[q] || {}),
    patternsection: `Section ${s + 1}`, patternquestion: `${s + 1}.${q + 1}`,
    patterngroup: "", patternsubquestion: "",
    questiontype: s === 0 ? "MCQ" : "Descriptive", marks: [1, 5, 10][s]
  }))
}));
