import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ep1 from "../api/ep1";
import global1 from "./global1";
import MenuPageShell from "./MenuPageShell";
import {
  defaultColourScheme,
  getStoredColourScheme,
  loadColourScheme,
  persistColourScheme
} from "../utils/colourScheme";

const fields = [
  ["appBarStart", "App bar gradient start"],
  ["appBarEnd", "App bar gradient end"],
  ["appBarText", "App bar text"],
  ["drawerBg", "Left menu background"],
  ["drawerText", "Left menu text"],
  ["drawerActive", "Left menu icon/accent"],
  ["pageBgStart", "Page background start"],
  ["pageBgEnd", "Page background end"],
  ["cardBg", "Card background"],
  ["primary", "Primary button"],
  ["secondary", "Secondary colour"],
  ["accent", "Accent colour"],
  ["border", "Border colour"],
  ["text", "Main text"],
  ["mutedText", "Muted text"],
  ["buttonText", "Button text"]
];

const referenceScheme = {
  ...defaultColourScheme,
  name: "Reference light blue",
  appBarStart: "#dce9ff",
  appBarEnd: "#f7fbff",
  drawerBg: "#eaf3ff",
  pageBgStart: "#e9f2ff",
  pageBgEnd: "#f8fbff",
  primary: "#3f7df6",
  secondary: "#34c759",
  accent: "#ff7a45",
  border: "#dce8fb",
  text: "#2d3346"
};

export default function ColourSchemePage() {
  const [scheme, setScheme] = useState(() => getStoredColourScheme());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadColourScheme().then((loaded) => setScheme(loaded));
  }, []);

  const update = (field, value) => {
    const next = { ...scheme, [field]: value };
    setScheme(next);
    persistColourScheme(next);
  };

  const save = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");
      const res = await ep1.post("/api/v2/colour-scheme", {
        ...scheme,
        colid: global1.colid,
        user: global1.user,
        username: global1.name
      });
      const saved = persistColourScheme(res.data?.data || scheme);
      setScheme(saved);
      setMessage("Colour scheme saved and applied globally.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save colour scheme.");
    } finally {
      setSaving(false);
    }
  };

  const resetReference = () => {
    setScheme(referenceScheme);
    persistColourScheme(referenceScheme);
    setMessage("Reference light blue scheme applied. Click Save to persist it.");
  };

  const previewItems = useMemo(() => [
    { label: "Website Forms", value: "1,245", color: scheme.primary },
    { label: "WhatsApp", value: "842", color: scheme.secondary },
    { label: "Referrals", value: "540", color: scheme.accent },
    { label: "Bulk Uploads", value: "260", color: "#60a5fa" }
  ], [scheme]);

  return (
    <MenuPageShell title="Colour Scheme">
      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={950}>Colour scheme</Typography>
            <Typography color="text.secondary">Set global colours for app bar, left menu, backgrounds, cards, buttons and text.</Typography>
          </Box>
          {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

          <Paper elevation={0} sx={{ p: 2, border: "1px solid var(--campus-border)", borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Scheme name" value={scheme.name || ""} onChange={(e) => update("name", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={8}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={save}>{saving ? "Saving..." : "Save and apply"}</Button>
                  <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={resetReference}>Use light blue reference</Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} lg={7}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid var(--campus-border)", borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Palette controls</Typography>
                <Grid container spacing={2}>
                  {fields.map(([field, label]) => (
                    <Grid item xs={12} sm={6} md={4} key={field}>
                      <Stack spacing={0.75}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField type="color" value={scheme[field] || "#ffffff"} onChange={(e) => update(field, e.target.value)} sx={{ width: 72, "& input": { p: 0.5, height: 38 } }} />
                          <TextField fullWidth size="small" value={scheme[field] || ""} onChange={(e) => update(field, e.target.value)} />
                        </Stack>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12} lg={5}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid var(--campus-border)", borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Live preview</Typography>
                <Box sx={{ borderRadius: 3, overflow: "hidden", border: `1px solid ${scheme.border}` }}>
                  <Box sx={{ p: 2, background: `linear-gradient(135deg, ${scheme.appBarStart}, ${scheme.appBarEnd})`, color: scheme.appBarText, fontWeight: 900 }}>
                    App bar preview
                  </Box>
                  <Box sx={{ display: "flex", minHeight: 330, background: `linear-gradient(180deg, ${scheme.pageBgStart}, ${scheme.pageBgEnd})` }}>
                    <Box sx={{ width: 145, p: 1.25, background: `linear-gradient(180deg, ${scheme.drawerBg}, #ffffff)`, color: scheme.drawerText, borderRight: `1px solid ${scheme.border}` }}>
                      {["Dashboard", "CRM", "Settings", "Help"].map((item, index) => (
                        <Box key={item} sx={{ p: 1, mb: 0.75, borderRadius: 1.5, bgcolor: index === 1 ? "rgba(63,125,246,0.12)" : "transparent", color: index === 1 ? scheme.drawerActive : scheme.drawerText }}>
                          {item}
                        </Box>
                      ))}
                    </Box>
                    <Box sx={{ flex: 1, p: 2 }}>
                      <Typography fontWeight={900} color={scheme.text}>Lead Sources</Typography>
                      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                        {previewItems.map((item) => (
                          <Grid item xs={6} key={item.label}>
                            <Box sx={{ p: 1.25, bgcolor: scheme.cardBg, border: `1px solid ${scheme.border}`, borderRadius: 2 }}>
                              <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: `${item.color}22`, mb: 0.5 }} />
                              <Typography variant="body2" color={scheme.text}>{item.label}</Typography>
                              <Typography fontWeight={900} color={scheme.text}>{item.value}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button variant="contained" sx={{ bgcolor: scheme.primary, color: scheme.buttonText }}>Primary</Button>
                        <Button variant="outlined" sx={{ borderColor: scheme.primary, color: scheme.primary }}>Secondary</Button>
                      </Stack>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
