const text = value => String(value ?? '').trim();
const scopeFields = ['academicyear','regulation','programcode','coursecode'];
const number = value => value === '' || value == null || !Number.isFinite(Number(value)) ? null : Number(value);
export const cceNumber = value => value == null ? '-' : Number(Number(value).toFixed(2)).toString();
const componentKey = row => JSON.stringify([text(row.assessmentcomponent), text(row.componenttype), text(row.assessmentgroup)]);
const uniqueValue = values => { const unique = [...new Set(values.filter(value => value != null))]; return unique.length === 1 ? unique[0] : null; };
export function buildCceReports(marks, components = []) {
  const groups = new Map();
  for (const mark of marks) {
    if (mark.scoretype !== 'Internal' || mark.approvalstatus !== 'Approved') continue;
    const key = JSON.stringify(['academicyear','regulation','programcode','semester','examcode'].map(field => text(mark[field])));
    if (!groups.has(key)) groups.set(key, { key, ...Object.fromEntries(['academicyear','regulation','program','programcode','semester','exam','examcode'].map(field => [field, mark[field]])), marks: [] });
    groups.get(key).marks.push(mark);
  }
  return [...groups.values()].map(group => {
    const courses = new Map(), columns = new Map();
    for (const mark of group.marks) {
      if (!courses.has(mark.coursecode)) courses.set(mark.coursecode, { coursecode: mark.coursecode, course: mark.course, marks: [] });
      courses.get(mark.coursecode).marks.push(mark);
    }
    for (const course of courses.values()) {
      course.components = components.filter(component => scopeFields.every(field => text(component[field]) === text(course.marks[0][field])) && (!text(component.semester) || text(component.semester) === text(group.semester)));
      for (const item of [...course.components, ...course.marks]) {
        const key = componentKey(item);
        if (!columns.has(key)) columns.set(key, { key, name: item.assessmentcomponent, type: item.componenttype, group: item.assessmentgroup, maxima: [], weights: [] });
      }
    }
    const rows = [...courses.values()].sort((a,b) => text(a.coursecode).localeCompare(text(b.coursecode), undefined, { numeric: true })).map(course => {
      let total = 0, totalmax = 0, completeMax = true;
      const cells = {};
      for (const column of columns.values()) {
        const matches = course.marks.filter(row => componentKey(row) === column.key).sort((a,b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));
        const mark = matches[0];
        const allConfig = course.components.filter(row => componentKey(row) === column.key);
        const exactConfig = allConfig.filter(row => text(row.semester) === text(group.semester));
        const config = exactConfig.length ? exactConfig : allConfig;
        if (!mark && !config.length) { cells[column.key] = { raw: '-', weighted: null, applicable: false }; continue; }
        const weight = number(mark?.weightage) ?? uniqueValue(config.map(row => number(row.weightage) ?? 1));
        const rawmax = number(mark?.rawmaxmarks) ?? uniqueValue(config.map(row => number(row.marks))) ?? (weight > 0 ? number(mark?.maxmarks) == null ? null : Number(mark.maxmarks) / weight : null);
        const weightedmax = number(mark?.maxmarks) ?? (rawmax != null && weight != null ? rawmax * weight : null);
        const absent = /^absent$/i.test(text(mark?.attendance));
        const weighted = !mark || absent ? 0 : number(mark.marksobtained);
        const savedRaw = number(mark?.rawmarks);
        const raw = !mark ? 'NS' : absent ? 'Absent' : savedRaw != null && (savedRaw !== 0 || weighted === 0) ? savedRaw : weight > 0 && weighted != null ? weighted / weight : null;
        cells[column.key] = { raw, weighted, rawmax, weight, applicable: true };
        column.maxima.push(rawmax); column.weights.push(weight);
        total += weighted || 0;
        if (weightedmax == null) completeMax = false; else totalmax += weightedmax;
      }
      return { coursecode: course.coursecode, course: course.course, cells, total: Math.ceil(Number(total.toFixed(6))), totalmax: completeMax ? Number(totalmax.toFixed(2)) : null };
    });
    const rank = column => /mid.*sem|mid.*term/i.test(column.name) ? 0 : /quiz/i.test(column.name) ? 1 : /project/i.test(column.name) ? 2 : /case/i.test(column.name) ? 3 : 4;
    const list = [...columns.values()].sort((a,b) => rank(a) - rank(b) || text(a.name).localeCompare(text(b.name), undefined, { numeric: true })).map(column => ({ ...column, rawmax: uniqueValue(column.maxima), weight: uniqueValue(column.weights), label: [...columns.values()].filter(other => other.name === column.name).length > 1 ? [column.name, column.type, column.group].filter(Boolean).join(' - ') : column.name }));
    return { ...group, columns: list, rows, totalmax: uniqueValue(rows.map(row => row.totalmax)) };
  }).sort((a,b) => text(a.semester).localeCompare(text(b.semester), undefined, { numeric: true }) || text(b.academicyear).localeCompare(text(a.academicyear)) || text(a.examcode).localeCompare(text(b.examcode)));
}
