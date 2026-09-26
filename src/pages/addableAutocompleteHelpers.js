export const addOption = (label, path) => ({ __addOption: true, label, path });

export const optionLabel = (option, field) => {
  if (option == null) return "";
  if (typeof option === "string") return option;
  if (option.__addOption) return option.label || "";
  return String(
    option[field]
    || option.label
    || option.name
    || option.program
    || option.programcode
    || option.regulation
    || option.subject
    || option.course
    || option.coursecode
    || option.institution
    || option.faculty
    || option.department
    || option.designation
    || option.title
    || option.value
    || ""
  );
};

export const withAddOption = (label, path, options = []) => [addOption(label, path), ...(options || [])];

export const isEmbeddedPage = () => {
  try {
    return new URLSearchParams(window.location.search).get("embedded") === "1";
  } catch {
    return false;
  }
};

export const embeddedAwarePath = (path) => {
  if (!isEmbeddedPage() || !path) return path;
  return `${path}${path.includes("?") ? "&" : "?"}embedded=1`;
};

export const navigateEmbeddedAware = (navigate, path) => navigate(embeddedAwarePath(path));

export const renderAddOption = (props, option, labelField = "label") => (
  <li {...props} style={option?.__addOption ? { fontWeight: 800, color: "#2563eb" } : undefined}>
    {optionLabel(option, labelField)}
  </li>
);

export const handleAddOption = (value, navigate, onValue) => {
  if (value?.__addOption) {
    navigateEmbeddedAware(navigate, value.path);
    return true;
  }
  if (onValue) onValue(value);
  return false;
};

export const addSelectValue = (path) => `__add__${path}`;

export const handleAddSelectValue = (value, navigate) => {
  if (typeof value === "string" && value.startsWith("__add__")) {
    navigateEmbeddedAware(navigate, value.replace("__add__", ""));
    return true;
  }
  return false;
};
