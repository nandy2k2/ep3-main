import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";
import MenuPageShell from "./MenuPageShell";
import { persistGlobalSession } from "./global1";

const embeddedUrl = (path) => `${path}${path.includes("?") ? "&" : "?"}embedded=1`;

export default function EmbeddedWizardShell({ title, subtitle, steps, startLabel = "Start" }) {
  const navigate = useNavigate();
  persistGlobalSession();
  const [activeStep, setActiveStep] = useState(0);
  const [frameKey, setFrameKey] = useState(0);
  const [frameLoading, setFrameLoading] = useState(true);
  const active = steps[activeStep] || steps[0];
  const progress = useMemo(() => Math.round(((activeStep + 1) / Math.max(steps.length, 1)) * 100), [activeStep, steps.length]);

  useEffect(() => {
    persistGlobalSession();
  }, [activeStep, frameKey]);

  useEffect(() => {
    setFrameLoading(true);
  }, [activeStep, frameKey]);

  return (
    <MenuPageShell title={title}>
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f6f8fb", minHeight: "100vh" }}>
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <Box sx={{ width: 54, height: 54, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "#e0f2fe", color: "#075985" }}>
                {active?.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" fontWeight={950}>{title}</Typography>
                <Typography color="text.secondary">{subtitle}</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => setFrameKey((value) => value + 1)}>Refresh step</Button>
                <Button variant="contained" onClick={() => setActiveStep(0)}>{startLabel}</Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Stack spacing={1.2}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
                <Typography fontWeight={900}>Step {activeStep + 1} of {steps.length}: {active.title}</Typography>
                <Chip color="primary" variant="outlined" label={active.path} />
              </Stack>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 6 }} />
              <Typography variant="body2" color="text.secondary">
                This wizard embeds the original page. Any future change in the original page will automatically appear here.
              </Typography>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden" }}>
            <Tabs
              value={activeStep}
              onChange={(_, value) => setActiveStep(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: "1px solid #e5e7eb", bgcolor: "#fff" }}
            >
              {steps.map((step, index) => (
                <Tab key={step.title} icon={step.icon} iconPosition="start" label={step.title} />
              ))}
            </Tabs>
            <Box sx={{ p: 1.5, bgcolor: "#fff" }}>
              {active.description && <Alert severity="info" sx={{ mb: 1.5 }}>{active.description}</Alert>}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Button variant="outlined" disabled={activeStep === 0} onClick={() => setActiveStep((value) => Math.max(0, value - 1))}>Previous</Button>
                <Button variant="outlined" disabled={activeStep === steps.length - 1} onClick={() => setActiveStep((value) => Math.min(steps.length - 1, value + 1))}>Next</Button>
                <Button variant="outlined" startIcon={<OpenInNewIcon />} onClick={() => navigate(active.path)}>Open full page</Button>
              </Stack>
              <Box sx={{ position: "relative" }}>
                {frameLoading && (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={1.5}
                    sx={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 2,
                      minHeight: "calc(100vh - 270px)",
                      height: "82vh",
                      border: "1px solid #d1d5db",
                      borderRadius: 1,
                      bgcolor: "rgba(255,255,255,0.9)"
                    }}
                  >
                    <CircularProgress />
                    <Typography fontWeight={900}>Loading {active.title}...</Typography>
                  </Stack>
                )}
                <Box
                  key={`${active.path}-${frameKey}`}
                  component="iframe"
                  src={embeddedUrl(active.path)}
                  title={active.title}
                  onLoad={() => setFrameLoading(false)}
                  sx={{
                    width: "100%",
                    minHeight: "calc(100vh - 270px)",
                    height: "82vh",
                    border: "1px solid #d1d5db",
                    borderRadius: 1,
                    bgcolor: "#fff"
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
