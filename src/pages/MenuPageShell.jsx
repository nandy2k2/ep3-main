import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  Toolbar,
  Typography
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { createTheme, styled, ThemeProvider } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { mainListItems } from "./menucas1";
import { mainListItems as studentListItems } from "./menustud1";
import ActivityPointBadge from "./ActivityPointBadge";
import TopMenuSearch from "./TopMenuSearch";
import global1 from "./global1";
import {
  applyColourScheme,
  colourSchemeChangedEvent,
  getStoredColourScheme,
  loadColourScheme,
  themeFromScheme
} from "../utils/colourScheme";

const drawerWidth = 250;
const menuStorageKey = "campus_menu_open";

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== "open"
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  })
}));

const DrawerStyled = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open"
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    height: "100vh",
    maxHeight: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
    color: "var(--campus-drawer-text)",
    background: "linear-gradient(180deg, var(--campus-drawer-bg) 0%, #ffffff 100%)",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9)
      }
    })
  }
}));

export default function MenuPageShell({ title, children, menuType }) {
  const embedded = (() => {
    try {
      return new URLSearchParams(window.location.search).get("embedded") === "1";
    } catch {
      return false;
    }
  })();
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(menuStorageKey);
      return saved === null ? true : saved === "true";
    } catch {
      return true;
    }
  });
  const [scheme, setScheme] = useState(() => applyColourScheme(getStoredColourScheme()));
  const theme = useMemo(() => createTheme(themeFromScheme(scheme)), [scheme]);

  useEffect(() => {
    let mounted = true;
    loadColourScheme().then((loaded) => {
      if (mounted) setScheme(loaded);
    });
    const handler = (event) => setScheme(applyColourScheme(event.detail || getStoredColourScheme()));
    window.addEventListener(colourSchemeChangedEvent, handler);
    return () => {
      mounted = false;
      window.removeEventListener(colourSchemeChangedEvent, handler);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(menuStorageKey, String(open));
    } catch {
      // Ignore storage errors and keep the in-memory drawer state.
    }
  }, [open]);

  const menuItems = menuType === "student" || String(global1.role || "").toLowerCase() === "student"
    ? studentListItems
    : mainListItems;
  const isAllRole = String(global1.role || "").trim().toLowerCase() === "all";

  const openModuleChooser = () => {
    try {
      localStorage.removeItem("campus_all_role_active_menu_group");
    } catch {
      // Ignore storage errors and continue navigation.
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  if (embedded) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, var(--campus-page-bg-start), var(--campus-page-bg-end))", color: "var(--campus-text)" }}>
          {children}
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBarStyled
          position="absolute"
          open={open}
          sx={{
            background: "linear-gradient(135deg, var(--campus-appbar-start), var(--campus-appbar-end))",
            color: "var(--campus-appbar-text)",
            boxShadow: "0 12px 32px rgba(63, 125, 246, 0.12)",
            borderBottom: "1px solid var(--campus-border)"
          }}
        >
          <Toolbar sx={{ pr: "24px" }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={() => setOpen(true)}
              sx={{ marginRight: "36px", ...(open && { display: "none" }) }}
            >
              <MenuIcon />
            </IconButton>
            <Typography component="h1" variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            <TopMenuSearch menuType={menuType} />
            <ActivityPointBadge sx={{ mr: 2 }} />
            {isAllRole && (
              <Button
                color="inherit"
                component={RouterLink}
                to="/all-role-menu-groups"
                onClick={openModuleChooser}
                sx={{ whiteSpace: "nowrap", mr: 1 }}
              >
                Module chooser
              </Button>
            )}
            <Button color="inherit" component={RouterLink} to="/central-ticket-raise" sx={{ whiteSpace: "nowrap", mr: 1 }}>
              Raise ticket
            </Button>
            <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout} sx={{ whiteSpace: "nowrap" }}>
              Logout
            </Button>
          </Toolbar>
        </AppBarStyled>
        <DrawerStyled variant="permanent" open={open}>
          <Toolbar sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", px: [1] }}>
            <Typography component="h1" variant="body1" color="inherit" noWrap sx={{ flexGrow: 1 }}>
              {global1.name}
            </Typography>
            <IconButton onClick={() => setOpen(false)} sx={{ color: "var(--campus-drawer-text)" }}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List sx={{
            pb: 3,
            "& .MuiListItem-root": { color: "var(--campus-drawer-text)", borderRadius: 1.5, mx: open ? 1 : 0.5, my: 0.25 },
            "& .MuiListItem-root:hover": { backgroundColor: "rgba(63, 125, 246, 0.12)" },
            "& .MuiListItemIcon-root": { color: "var(--campus-drawer-active)", minWidth: open ? 40 : 32 },
            "& .MuiAccordion-root": { background: "transparent", color: "var(--campus-drawer-text)", boxShadow: "none" },
            "& .MuiAccordionSummary-root": { minHeight: 42, borderRadius: 1.5 },
            "& .MuiAccordionSummary-root:hover": { backgroundColor: "rgba(63, 125, 246, 0.1)" }
          }}>{menuItems({ open })}</List>
        </DrawerStyled>
        <Box component="main" sx={{ flexGrow: 1, height: "100vh", overflow: "auto", background: "linear-gradient(180deg, var(--campus-page-bg-start), var(--campus-page-bg-end))", color: "var(--campus-text)" }}>
          <Toolbar />
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
