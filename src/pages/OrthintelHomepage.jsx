import React from "react";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Grid,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import GroupsIcon from "@mui/icons-material/Groups";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SchoolIcon from "@mui/icons-material/School";
import ScienceIcon from "@mui/icons-material/Science";

const heroImage = "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1600&q=85";

const loginLinks = [
  { label: "Faculty login", to: "/Login" },
  { label: "Resident Login", to: "/loginstud" }
  // { label: "Vendor login", to: "/purchase-new-vendor-login" },
  // { label: "Create account", to: "/signuppage" }
];

const highlights = [
  { title: "24-month orthodontic pathway", icon: SchoolIcon, text: "Structured clinical learning, digital treatment planning, research work, seminars, and progressive case responsibility." },
  { title: "AI-supported clinical learning", icon: PsychologyIcon, text: "Course material, case discussion, assessment, question generation, evaluation, transcript, and feedback workflows." },
  { title: "Residency operations ERP", icon: FactCheckIcon, text: "Admissions, document validation, fees, attendance, exams, grade cards, blockchain verification, and accreditation evidence." },
  { title: "Faculty and mentor network", icon: GroupsIcon, text: "Faculty workload, mentorship groups, CO attainment, course progression, remedial support, and resident learning profiles." }
];

const curriculum = [
  "Diagnosis, records, cephalometrics, 3D imaging and treatment planning",
  "Biomechanics, aligners, skeletal anchorage and interdisciplinary cases",
  "Research methodology, scholarly publication support and journal review",
  "Board preparation, clinical portfolio, ethics and practice management"
];

export default function OrthintelHomepage() {
  return (
    <Box sx={{ bgcolor: "#fbfaf7", color: "#172033", minHeight: "100vh" }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: "rgba(255,255,255,0.96)", color: "#172033", borderBottom: "1px solid #eadfd2", backdropFilter: "blur(16px)" }}>
        <Toolbar sx={{ minHeight: 78 }}>
          <Box component={RouterLink} to="/orthintel-home" sx={{ display: "flex", alignItems: "center", gap: 1.5, textDecoration: "none", color: "inherit", flexGrow: 1 }}>
            <Typography sx={{ fontWeight: 950, letterSpacing: 0, fontSize: { xs: 22, md: 28 } }}>
              OrthIntel
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
            <Button component="a" href="#program" sx={{ color: "#334155" }}>Program</Button>
            <Button component="a" href="#platform" sx={{ color: "#334155" }}>Platform</Button>
            <Button component="a" href="#apply" sx={{ color: "#334155" }}>Apply</Button>
            <Button variant="outlined" component={RouterLink} to="/Login">Login</Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ pt: { xs: 10, md: 12 } }}>
        <Box
          sx={{
            minHeight: { xs: 680, md: "calc(100vh - 96px)" },
            display: "flex",
            alignItems: "center",
            backgroundImage: `linear-gradient(90deg, rgba(16,24,40,0.86), rgba(16,24,40,0.58), rgba(16,24,40,0.2)), url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: "#fff"
          }}
        >
          <Container maxWidth="xl">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={7}>
                <Stack spacing={2.4} sx={{ maxWidth: 820 }}>
                  <Chip icon={<AutoAwesomeIcon />} label="Orthodontics, AI and academic operations in one intelligent platform" sx={{ alignSelf: "flex-start", bgcolor: "rgba(255,255,255,0.92)", color: "#7a3413", fontWeight: 900 }} />
                  <Typography variant="h1" sx={{ fontWeight: 950, fontSize: { xs: 42, md: 72 }, lineHeight: 1.02, letterSpacing: 0 }}>
                    Orthodontics residency powered by intelligent academic infrastructure.
                  </Typography>
                  <Typography variant="h6" sx={{ maxWidth: 760, lineHeight: 1.7, color: "rgba(255,255,255,0.9)" }}>
                    A focused homepage for OrthIntel: admissions, residency learning, clinical education, assessments, accreditation evidence and AI-supported workflows for modern orthodontic education.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Button size="large" variant="contained" component={RouterLink} to="/Login" endIcon={<ArrowForwardIcon />} sx={{ bgcolor: "#c2410c", "&:hover": { bgcolor: "#9a3412" } }}>
                      Login to platform
                    </Button>
                  </Stack>
                </Stack>
              </Grid>
              <Grid item xs={12} md={5}>
                <Card sx={{ borderRadius: 2, bgcolor: "rgba(255,255,255,0.95)", color: "#172033", boxShadow: "0 24px 80px rgba(0,0,0,0.28)" }}>
                  <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                    <Stack spacing={2}>
                      <Typography variant="h5" fontWeight={950}>Quick Access</Typography>
                      <Typography color="text.secondary">Choose your workspace and continue directly into the system.</Typography>
                      {loginLinks.map((link) => (
                        <Button key={link.label} component={RouterLink} to={link.to} variant={link.label === "Faculty login" ? "contained" : "outlined"} fullWidth endIcon={<ArrowForwardIcon />} sx={{ justifyContent: "space-between", py: 1.2 }}>
                          {link.label}
                        </Button>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Container id="program" maxWidth="xl" sx={{ py: { xs: 6, md: 9 } }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="overline" sx={{ color: "#c2410c", fontWeight: 900 }}>Program Experience</Typography>
              <Typography variant="h3" sx={{ fontWeight: 950, mt: 1, mb: 2 }}>Clinical depth with digital discipline.</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Inspired by contemporary orthodontic residency pages, this homepage emphasizes clinical excellence, research, faculty mentorship and structured progression through a modern digital platform.
              </Typography>
            </Grid>
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <Grid item xs={12} sm={6} md={4} key={item.title}>
                  <Card sx={{ height: "100%", borderRadius: 2, border: "1px solid #eadfd2", boxShadow: "0 12px 40px rgba(15,23,42,0.06)" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={1.5}>
                        <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#fff7ed", color: "#c2410c", display: "grid", placeItems: "center" }}>
                          <Icon />
                        </Box>
                        <Typography variant="h6" fontWeight={900}>{item.title}</Typography>
                        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{item.text}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>

        <Box id="platform" sx={{ bgcolor: "#102033", color: "#fff", py: { xs: 6, md: 9 } }}>
          <Container maxWidth="xl">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Chip label="Digital orthodontics + ERP + LMS" sx={{ alignSelf: "flex-start", bgcolor: "#fed7aa", color: "#7c2d12", fontWeight: 900 }} />
                  <Typography variant="h3" sx={{ fontWeight: 950 }}>Run the residency, not just the website.</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.8 }}>
                    OrthIntel brings the operational layer behind advanced dental education: applicant validation, learning management, examination conduct, assessment analytics, fees, documents, faculty workload and reporting.
                  </Typography>
                  <Grid container spacing={1.5}>
                    {curriculum.map((item) => (
                      <Grid item xs={12} key={item}>
                        <Stack direction="row" spacing={1.2} alignItems="flex-start">
                          <ScienceIcon sx={{ color: "#fb923c", mt: 0.2 }} />
                          <Typography>{item}</Typography>
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  {[
                    { label: "Admissions", value: "AI validation" },
                    { label: "LMS", value: "Course workspace" },
                    { label: "Exams", value: "AI paper support" },
                    { label: "Records", value: "Blockchain verify" }
                  ].map((item) => (
                    <Grid item xs={12} sm={6} key={item.label}>
                      <Card sx={{ borderRadius: 2, bgcolor: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h4" fontWeight={950}>{item.value}</Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>{item.label}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Container id="apply" maxWidth="xl" sx={{ py: { xs: 6, md: 9 } }}>
          <Card sx={{ borderRadius: 2, border: "1px solid #eadfd2", bgcolor: "#fff", overflow: "hidden" }}>
            <Grid container>
              <Grid item xs={12} md={8}>
                <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                  <Stack spacing={2}>
                    <Typography variant="h3" fontWeight={950}>Ready to enter OrthIntel?</Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>Sign in through the role-based login routes below.</Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} useFlexGap flexWrap="wrap">
                      {loginLinks.map((link) => (
                        <Button key={link.label} component={RouterLink} to={link.to} variant="outlined">
                          {link.label}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>
                </CardContent>
              </Grid>
              <Grid item xs={12} md={4} sx={{ bgcolor: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
                <Stack alignItems="center" spacing={1.5} sx={{ textAlign: "center" }}>
                  <LocalHospitalIcon sx={{ fontSize: 72, color: "#c2410c" }} />
                  <Typography variant="h5" fontWeight={950}>Orthodontics AI workspace</Typography>
                  <Typography color="text.secondary">Purpose-built for residency operations, LMS, assessment and clinical education workflows.</Typography>
                </Stack>
              </Grid>
            </Grid>
          </Card>
        </Container>
      </Box>
    </Box>
  );
}
