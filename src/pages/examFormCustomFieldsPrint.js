const escape = value => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const display = value => {
  if (value === undefined || value === null || value === "") return "-";
  if (Array.isArray(value)) return value.map(display).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export function customFieldsPrintHtml(tabs = [], values = {}) {
  const sections = [...tabs].sort((a, b) => Number(a.order || 0) - Number(b.order || 0)).map(tab => {
    const rows = [...(tab.fields || [])].sort((a, b) => Number(a.order || 0) - Number(b.order || 0)).map(field => `<tr><th style="width:35%">${escape(field.label || field.fieldname)}</th><td style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(display(values[field.fieldname]))}</td></tr>`).join("");
    return rows ? `<h3 style="font-size:12px;margin-bottom:4px">${escape(tab.title)}</h3><table><tbody>${rows}</tbody></table>` : "";
  }).join("");
  return `<section><div class="section-title">Custom Form Fields</div>${sections || "<p>No custom fields configured for the selected form.</p>"}</section>`;
}
