const storageKey = "campusGlobal1Session";

const readStoredSession = () => {
  try {
    if (typeof window === "undefined") return {};
    return JSON.parse(window.sessionStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
};

const global1 = { ...readStoredSession() };

export const persistGlobalSession = (source = global1) => {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey, JSON.stringify({ ...source }));
  } catch {
    // Session persistence is a convenience for embedded pages; ignore storage failures.
  }
};

export const hydrateGlobalSession = () => {
  Object.assign(global1, readStoredSession());
  return global1;
};

export default global1;
