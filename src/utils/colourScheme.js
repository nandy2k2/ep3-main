import ep1 from "../api/ep1";
import global1 from "../pages/global1";

export const colourSchemeStorageKey = "campus_colour_scheme";
export const colourSchemeChangedEvent = "campus-colour-scheme-changed";

export const defaultColourScheme = {
  name: "Light blue gradient",
  appBarStart: "#dce9ff",
  appBarEnd: "#f7fbff",
  appBarText: "#1f2a44",
  drawerBg: "#eff6ff",
  drawerText: "#1f2a44",
  drawerActive: "#3f7df6",
  pageBgStart: "#eef5ff",
  pageBgEnd: "#f8fbff",
  cardBg: "#ffffff",
  primary: "#3f7df6",
  secondary: "#38bdf8",
  accent: "#ff7a45",
  border: "#dbeafe",
  text: "#263044",
  mutedText: "#64748b",
  buttonText: "#ffffff"
};

const safeScheme = (scheme = {}) => ({ ...defaultColourScheme, ...(scheme || {}) });

const ensureGlobalColourSchemeStyle = () => {
  if (typeof document === "undefined") return;
  const styleId = "campus-global-colour-scheme-style";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    body {
      background: linear-gradient(180deg, var(--campus-page-bg-start), var(--campus-page-bg-end));
      color: var(--campus-text);
    }

    body:not(.campus-home-page) header.MuiAppBar-root,
    body:not(.campus-home-page) .MuiAppBar-root {
      background: linear-gradient(135deg, var(--campus-appbar-start), var(--campus-appbar-end)) !important;
      color: var(--campus-appbar-text) !important;
      box-shadow: 0 12px 32px rgba(63, 125, 246, 0.12) !important;
      border-bottom: 1px solid var(--campus-border);
    }

    .MuiDrawer-paper {
      background: linear-gradient(180deg, var(--campus-drawer-bg) 0%, #ffffff 100%) !important;
      color: var(--campus-drawer-text) !important;
      height: 100vh !important;
      max-height: 100vh !important;
      overflow-y: auto !important;
      overflow-x: hidden;
    }

    .MuiDrawer-paper .MuiListItemButton-root,
    .MuiDrawer-paper .MuiListItem-root,
    .MuiDrawer-paper .MuiListItemIcon-root,
    .MuiDrawer-paper .MuiListItemText-root,
    .MuiDrawer-paper .MuiTypography-root {
      color: var(--campus-drawer-text);
    }

    .MuiDrawer-paper .MuiListItemButton-root:hover,
    .MuiDrawer-paper .MuiListItem-root:hover {
      background: rgba(63, 125, 246, 0.1);
      color: var(--campus-drawer-active);
    }

    .MuiPaper-root,
    .MuiCard-root {
      background-color: var(--campus-card-bg);
      border-color: var(--campus-border);
    }
  `;
  document.head.appendChild(style);
};

export const getStoredColourScheme = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(colourSchemeStorageKey) || "null");
    return safeScheme(stored);
  } catch {
    return defaultColourScheme;
  }
};

export const applyColourScheme = (schemeInput = {}) => {
  const scheme = safeScheme(schemeInput);
  ensureGlobalColourSchemeStyle();
  const root = document.documentElement;
  root.style.setProperty("--campus-appbar-start", scheme.appBarStart);
  root.style.setProperty("--campus-appbar-end", scheme.appBarEnd);
  root.style.setProperty("--campus-appbar-text", scheme.appBarText);
  root.style.setProperty("--campus-drawer-bg", scheme.drawerBg);
  root.style.setProperty("--campus-drawer-text", scheme.drawerText);
  root.style.setProperty("--campus-drawer-active", scheme.drawerActive);
  root.style.setProperty("--campus-page-bg-start", scheme.pageBgStart);
  root.style.setProperty("--campus-page-bg-end", scheme.pageBgEnd);
  root.style.setProperty("--campus-card-bg", scheme.cardBg);
  root.style.setProperty("--campus-primary", scheme.primary);
  root.style.setProperty("--campus-secondary", scheme.secondary);
  root.style.setProperty("--campus-accent", scheme.accent);
  root.style.setProperty("--campus-border", scheme.border);
  root.style.setProperty("--campus-text", scheme.text);
  root.style.setProperty("--campus-muted-text", scheme.mutedText);
  root.style.setProperty("--campus-button-text", scheme.buttonText);
  return scheme;
};

export const persistColourScheme = (schemeInput = {}) => {
  const scheme = applyColourScheme(schemeInput);
  try {
    localStorage.setItem(colourSchemeStorageKey, JSON.stringify(scheme));
    window.dispatchEvent(new CustomEvent(colourSchemeChangedEvent, { detail: scheme }));
  } catch {
    // Local persistence is best effort; backend save still works.
  }
  return scheme;
};

export const loadColourScheme = async () => {
  const cached = getStoredColourScheme();
  applyColourScheme(cached);
  if (!global1.colid) return cached;
  try {
    const res = await ep1.get("/api/v2/colour-scheme", { params: { colid: global1.colid } });
    if (res.data?.data) return persistColourScheme(res.data.data);
  } catch {
    // Keep cached/default palette if backend is unavailable.
  }
  return cached;
};

export const themeFromScheme = (schemeInput = {}) => {
  const scheme = safeScheme(schemeInput);
  return {
    palette: {
      primary: { main: scheme.primary, contrastText: scheme.buttonText },
      secondary: { main: scheme.secondary },
      background: { default: scheme.pageBgStart, paper: scheme.cardBg },
      text: { primary: scheme.text, secondary: scheme.mutedText }
    },
    shape: { borderRadius: 10 },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: "var(--campus-card-bg)",
            borderColor: "var(--campus-border)"
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: "var(--campus-card-bg)",
            borderColor: "var(--campus-border)"
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: "none", borderRadius: 10 }
        }
      }
    }
  };
};
