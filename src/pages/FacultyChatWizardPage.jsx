import React, { useMemo, useState } from "react";
import {
  AutoStories,
  CameraAlt,
  Dashboard,
  FactCheck,
  HowToReg,
  MenuBook,
  Quiz,
  Science,
  Send,
  Web
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MenuPageShell from "./MenuPageShell";
import global1 from "./global1";

const embeddedUrl = (path) => `${path}${path.includes("?") ? "&" : "?"}embedded=1`;

const primaryOptions = [
  {
    key: "attendance",
    label: "Attendance",
    icon: <HowToReg />,
    helper: "Take regular, photo, OTP, sectionwise, specialization or elective attendance.",
    children: [
      { label: "Attendance", path: "/neplmsattendance" },
      {
        key: "photoAttendance",
        label: "Photo Attendance",
        icon: <CameraAlt />,
        children: [
          { label: "Register photo", path: "/studentphotoupload" },
          { label: "Take photo attendance", path: "/neplmsphotoattendance" }
        ]
      },
      { label: "OTP attendance", path: "/neplmsotpattendance" },
      { label: "Sectionwise attendance", path: "/neplmssectionwiseattendance" },
      { label: "Specialization wise attendance", path: "/specializationnewattendance" },
      { label: "Elective attendance", path: "/neplmsenrollmentattendance" }
    ]
  },
  {
    key: "workspace",
    label: "Assignments / Lesson plan / Sequence / Course material",
    icon: <MenuBook />,
    helper: "Open the course workspace for teaching content, assignments and lesson work.",
    path: "/neplmscourseworkspace"
  },
  {
    key: "quiz",
    label: "Quiz",
    icon: <Quiz />,
    helper: "Create quiz or check quiz score analytics.",
    children: [
      { label: "Create quiz", path: "/neplmscourseworkspace" },
      { label: "Check score", path: "/neplmsquizanalytics" }
    ]
  },
  {
    key: "onlineExam",
    label: "Online exam",
    icon: <Web />,
    helper: "Create exams, review responses, or transfer marks.",
    children: [
      { label: "Create online examination", path: "/online-examination" },
      { label: "Check responses", path: "/online-exam-responses" },
      { label: "Transfer marks", path: "/conduct-exam-online-exam-marks-transfer" }
    ]
  },
  {
    key: "syllabus",
    label: "Syllabus",
    icon: <AutoStories />,
    helper: "Open My Syllabus for courses assigned to you.",
    path: "/mysyllabus"
  },
  {
    key: "co",
    label: "CO",
    icon: <FactCheck />,
    helper: "Open My CO for course outcome entry and review.",
    path: "/myco"
  },
  {
    key: "dashboard",
    label: "Dashboard",
    icon: <Dashboard />,
    helper: "Go to your faculty dashboard.",
    path: "/facultydashboard"
  }
];

function BotMessage({ children, icon = <Science /> }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Avatar sx={{ bgcolor: "#e0f2fe", color: "#075985" }}>{icon}</Avatar>
      <Paper sx={{ p: 2, bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 3, maxWidth: 760 }}>
        {children}
      </Paper>
    </Stack>
  );
}

function UserBubble({ children }) {
  return (
    <Stack direction="row" justifyContent="flex-end">
      <Paper sx={{ p: 1.5, bgcolor: "#2563eb", color: "#fff", borderRadius: 3, maxWidth: 680 }}>
        <Typography fontWeight={800}>{children}</Typography>
      </Paper>
    </Stack>
  );
}

export default function FacultyChatWizardPage() {
  const [active, setActive] = useState(null);
  const [activeChild, setActiveChild] = useState(null);
  const [popup, setPopup] = useState({ open: false, title: "", path: "" });
  const [popupLoading, setPopupLoading] = useState(false);
  const selected = useMemo(() => primaryOptions.find((item) => item.key === active), [active]);
  const selectedChild = useMemo(() => selected?.children?.find((item) => item.key === activeChild), [selected, activeChild]);

  const openPagePopup = (option) => {
    if (!option?.path) return;
    setPopupLoading(true);
    setPopup({ open: true, title: option.label || "Page", path: option.path });
  };

  const closePopup = () => {
    setPopup({ open: false, title: "", path: "" });
    setPopupLoading(false);
  };

  const openOption = (option) => {
    if (option.path) {
      openPagePopup(option);
      return;
    }
    setActive(option.key);
    setActiveChild(null);
  };

  const openChildOption = (option) => {
    if (option.path) {
      openPagePopup(option);
      return;
    }
    setActiveChild(option.key);
  };

  return (
    <MenuPageShell title="Faculty Chat Wizard">
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fb", p: { xs: 1.5, md: 2.5 } }}>
        <Paper sx={{ minHeight: 680, width: "100%", display: "flex", flexDirection: "column", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: "auto" }}>
            <Stack spacing={2.2}>
              <BotMessage>
                <Typography variant="h6" fontWeight={900}>Faculty Chat Wizard</Typography>
                <Typography fontWeight={800}>Welcome {global1.name || "Faculty"}. How can I help you today?</Typography>
                <Typography color="text.secondary">
                  Tap one of the reply options below. Some options will ask one more question before navigating.
                </Typography>
              </BotMessage>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ pl: { xs: 0, md: 7 } }}>
                {primaryOptions.map((option) => (
                  <Button
                    key={option.key}
                    variant={active === option.key ? "contained" : "outlined"}
                    startIcon={option.icon}
                    onClick={() => openOption(option)}
                    sx={{
                      mb: 1,
                      borderRadius: 999,
                      textTransform: "none",
                      justifyContent: "flex-start",
                      maxWidth: { xs: "100%", md: 430 },
                      whiteSpace: "normal",
                      textAlign: "left"
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>

              {selected && (
                <UserBubble>{selected.label}</UserBubble>
              )}

              {selected?.children && (
                <BotMessage icon={<Send />}>
                  <Typography fontWeight={900} sx={{ mb: 0.5 }}>{selected.label}</Typography>
                  <Typography color="text.secondary" sx={{ mb: 1.5 }}>What would you like to do?</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selected.children.map((child) => (
                      <Button
                        key={child.label}
                        variant={activeChild === child.key ? "contained" : "outlined"}
                        startIcon={child.icon || null}
                        onClick={() => openChildOption(child)}
                        sx={{ mb: 1, borderRadius: 999, textTransform: "none" }}
                      >
                        {child.label}
                      </Button>
                    ))}
                  </Stack>
                </BotMessage>
              )}

              {selectedChild && (
                <UserBubble>{selectedChild.label}</UserBubble>
              )}

              {selectedChild?.children && (
                <BotMessage icon={<Send />}>
                  <Typography fontWeight={900} sx={{ mb: 0.5 }}>{selectedChild.label}</Typography>
                  <Typography color="text.secondary" sx={{ mb: 1.5 }}>Choose the next attendance action.</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedChild.children.map((child) => (
                      <Button
                        key={child.label}
                        variant="contained"
                        onClick={() => openPagePopup(child)}
                        sx={{ mb: 1, borderRadius: 999, textTransform: "none" }}
                      >
                        {child.label}
                      </Button>
                    ))}
                  </Stack>
                </BotMessage>
              )}
            </Stack>
          </Box>
        </Paper>
        <Dialog
          open={popup.open}
          onClose={closePopup}
          fullWidth
          maxWidth={false}
          PaperProps={{ sx: { width: "96vw", height: "92vh", borderRadius: 2 } }}
        >
          <DialogTitle sx={{ py: 1, pr: 6, fontWeight: 900 }}>
            {popup.title}
            <IconButton
              aria-label="Close"
              onClick={closePopup}
              sx={{ position: "absolute", right: 8, top: 6 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, height: "100%", position: "relative" }}>
            {popupLoading && (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1.5}
                sx={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                  bgcolor: "rgba(255,255,255,0.88)"
                }}
              >
                <CircularProgress />
                <Typography fontWeight={900}>Loading page...</Typography>
              </Stack>
            )}
            {popup.path && (
              <Box
                component="iframe"
                title={popup.title}
                src={embeddedUrl(popup.path)}
                onLoad={() => setPopupLoading(false)}
                sx={{ border: 0, width: "100%", height: "100%", display: "block" }}
              />
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </MenuPageShell>
  );
}
