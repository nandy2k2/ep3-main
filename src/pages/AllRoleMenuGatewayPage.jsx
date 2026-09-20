import React, { useMemo, useState } from "react";
import {
  AutoAwesome,
  Business,
  DashboardCustomize,
  KeyboardArrowRight,
  MenuOpen,
  School,
  SettingsApplications
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MenuPageShell from "./MenuPageShell";
import { menuitemsall } from "./menuall";

export const allRoleMenuStorageKey = "campus_all_role_active_menu_group";

const commonGroups = new Set([
  "help",
  "ai coding",
  "ai training",
  "dashboard",
  "ai help",
  "quick setup wizard",
  "task new",
  "settings"
]);

const hiddenGroups = new Set([
  "patient management",
  "patient admission",
  "bed management",
  "mrd hospital",
  "hospital billing",
  "patient counseling",
  "patient counselling",
  "hospital food",
  "merit list gj",
  "class and attendance",
  "breakout rooms",
  "leave old",
  "academics and regulations",
  "regulation"
]);

const flattenChildren = (children) => React.Children.toArray(children).filter(Boolean);

const getElementText = (node) => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!React.isValidElement(node)) return "";
  if (typeof node.props?.primary === "string") return node.props.primary;
  return flattenChildren(node.props?.children).map(getElementText).filter(Boolean).join(" ");
};

const findFirstPath = (node) => {
  if (!React.isValidElement(node)) return "";
  if (node.props?.to) return node.props.to;
  for (const child of flattenChildren(node.props?.children)) {
    const found = findFirstPath(child);
    if (found) return found;
  }
  return "";
};

const extractGroups = () => {
  const tree = menuitemsall();
  if (!React.isValidElement(tree)) return [];
  const seen = new Set();
  return flattenChildren(tree.props?.children).reduce((groups, accordion) => {
    if (!React.isValidElement(accordion)) return groups;
    const accordionChildren = flattenChildren(accordion.props?.children);
    const title = getElementText(accordionChildren[0]).trim();
    const key = title.toLowerCase();
    const firstPath = findFirstPath(accordionChildren[1]);
    if (!title || !firstPath || commonGroups.has(key) || hiddenGroups.has(key) || seen.has(key)) return groups;
    seen.add(key);
    groups.push({ title, firstPath });
    return groups;
  }, []);
};

const cardIcon = (index) => {
  const icons = [<AutoAwesome />, <School />, <Business />, <DashboardCustomize />, <SettingsApplications />, <MenuOpen />];
  return icons[index % icons.length];
};

const groupBuckets = [
  {
    title: "AI and Automation",
    description: "AI agents, chatbot builders, AI coding, voice agents and automation-related modules.",
    matches: ["ai", "agent", "automation", "voice", "mcp"]
  },
  {
    title: "CRM and Admission",
    description: "Lead, admission, parent, entrance, ID card and applicant-facing workflows.",
    matches: ["crm", "admission", "parent details", "admission entrance", "id card"]
  },
  {
    title: "Academics",
    description: "Academic setup, workload, LMS, CO/PO attainment, PhD, feedback and learning workflows.",
    matches: [
      "academic configuration",
      "academics",
      "workload",
      "integrated lms",
      "mooc",
      "add on course",
      "mentoring",
      "student welfare",
      "bos",
      "specialization",
      "co po",
      "attainment",
      "phd",
      "feedback",
      "mca marksheet"
    ]
  },
  {
    title: "Fees and Finance",
    description: "Fees, receipts, finance, payment gateways, scholarship, budget and accounts.",
    matches: ["fees", "finance", "accounts", "payment gateway", "scholarship", "budget approval", "counter fee", "pending fees"]
  },
  {
    title: "Placement",
    description: "Placement, placement practice tests, psychometric tests, internships and training workflows.",
    matches: ["placement", "training and placement", "placement coordinator", "placement new", "placement practice", "psychometric"]
  },
  {
    title: "Examination",
    description: "Conduct, online exams, question papers, scanning, evaluation, invigilation, appeal and results.",
    matches: [
      "conduct examination",
      "online examination",
      "question paper management",
      "exam scanning",
      "evaluator management",
      "invigilation management",
      "appeal",
      "result processing",
      "examination",
      "hall ticket"
    ]
  },
  {
    title: "HR",
    description: "Users, HR, salary, attendance, appraisal, recruitment and staff operations.",
    matches: ["user management", "user data management", "hr", "salary and attendance", "hr and salary", "appraisal", "recruitment", "staff", "attendance"]
  },
  {
    title: "Personal Data",
    description: "Personal CAS, CAS new and personal data submissions.",
    matches: ["personal cas data", "cas new", "personal data new"]
  },
  {
    title: "Accreditation",
    description: "Accreditation, NBA, SAR and academic audit workflows.",
    matches: ["accreditation", "nba", "academic audit", "sar"]
  },
  {
    title: "Campus Operations",
    description: "Purchase, library, assets, transport, estate, visitors, hostel and facilities.",
    matches: ["purchase", "library", "asset", "transport", "estate", "visitor", "hostel", "guest house", "repair"]
  },
  {
    title: "Student Life and Placement",
    description: "Alumni, sports, NCC, NSS, extracurricular and student council workflows.",
    matches: ["alumni", "sports", "ncc", "nss", "extracurricular", "student council", "cultural"]
  },
  {
    title: "Institution and Governance",
    description: "Institution records, circulars, committees, statutes, ordinances, affiliation, MoU and legal matters.",
    matches: ["institution", "circular", "minutes", "committee", "statute", "ordinance", "affiliation", "legal", "rules", "mou"]
  }
];

const bucketForGroup = (group) => {
  const value = String(group.title || "").toLowerCase();
  return groupBuckets.find((bucket) => bucket.matches.some((match) => value.includes(match)))?.title || "Other Modules";
};

const groupedMenuGroups = (groups) => {
  const byTitle = new Map([
    ...groupBuckets.map((bucket) => [bucket.title, { ...bucket, groups: [] }]),
    ["Other Modules", {
      title: "Other Modules",
      description: "Additional module groups that do not match the common categories.",
      matches: [],
      groups: []
    }]
  ]);

  groups.forEach((group) => {
    const bucketTitle = bucketForGroup(group);
    byTitle.get(bucketTitle).groups.push(group);
  });

  return Array.from(byTitle.values()).filter((bucket) => bucket.groups.length);
};

export default function AllRoleMenuGatewayPage() {
  const navigate = useNavigate();
  const groups = useMemo(() => extractGroups(), []);
  const grouped = useMemo(() => groupedMenuGroups(groups), [groups]);
  const [loadingGroup, setLoadingGroup] = useState("");
  const [activeBucket, setActiveBucket] = useState(grouped[0]?.title || "");
  const [bucketDialogOpen, setBucketDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const openGroup = (group) => {
    setLoadingGroup(group.title);
    localStorage.setItem(allRoleMenuStorageKey, group.title);
    setTimeout(() => navigate(group.firstPath), 120);
  };

  const clearScope = () => {
    localStorage.removeItem(allRoleMenuStorageKey);
    setLoadingGroup("");
    setBucketDialogOpen(false);
  };

  const query = search.trim().toLowerCase();
  const visibleBuckets = grouped
    .map((bucket) => ({
      ...bucket,
      groups: bucket.groups.filter((group) => {
        const haystack = `${bucket.title} ${bucket.description} ${group.title}`.toLowerCase();
        return !query || haystack.includes(query);
      })
    }))
    .filter((bucket) => bucket.groups.length || (!query && bucket.title === activeBucket));

  const selectedBucket = visibleBuckets.find((bucket) => bucket.title === activeBucket) || visibleBuckets[0];
  const openBucket = (bucket) => {
    setActiveBucket(bucket.title);
    setBucketDialogOpen(true);
  };

  return (
    <MenuPageShell title="All Role Menu Groups">
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh" }}>
        <Stack spacing={3}>
          <Box
            sx={{
              p: { xs: 2.5, md: 4 },
              borderRadius: 4,
              background: "linear-gradient(135deg, #eaf3ff 0%, #f8fbff 58%, #ffffff 100%)",
              border: "1px solid #dbeafe"
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" fontWeight={950}>Choose a menu group</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  Select one working area. The side menu will show that group plus Help, Dashboard, AI Help, AI Coding, AI training, Quick setup wizard, Task new and Settings.
                </Typography>
              </Box>
              <TextField
                size="small"
                label="Search groups"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ minWidth: { xs: "100%", md: 280 }, bgcolor: "#fff", borderRadius: 1 }}
              />
              <Button variant="outlined" onClick={clearScope}>
                Show all menu
              </Button>
            </Stack>
            {loadingGroup && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress sx={{ height: 8, borderRadius: 5 }} />
                <Typography variant="body2" fontWeight={800} sx={{ mt: 1 }}>
                  Opening {loadingGroup}...
                </Typography>
              </Box>
            )}
          </Box>

          <Grid container spacing={2}>
            {visibleBuckets.map((bucket, index) => {
              const active = selectedBucket?.title === bucket.title;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={bucket.title}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      border: active ? "2px solid #2563eb" : "1px solid #dbeafe",
                      borderRadius: 3,
                      background: active ? "linear-gradient(180deg, #eaf3ff 0%, #ffffff 100%)" : "#fff",
                      boxShadow: active ? "0 18px 42px rgba(37,99,235,0.12)" : "none"
                    }}
                  >
                    <CardActionArea onClick={() => openBucket(bucket)} sx={{ height: "100%" }}>
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2.5,
                              display: "grid",
                              placeItems: "center",
                              color: "#2563eb",
                              bgcolor: "#dbeafe"
                            }}
                          >
                            {cardIcon(index)}
                          </Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="h6" fontWeight={950} sx={{ flex: 1 }}>{bucket.title}</Typography>
                            <Chip size="small" label={bucket.groups.length} />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">{bucket.description}</Typography>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Dialog open={bucketDialogOpen && !!selectedBucket} onClose={() => setBucketDialogOpen(false)} fullWidth maxWidth="lg">
            {selectedBucket && (
              <>
                <DialogTitle>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight={950}>{selectedBucket.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{selectedBucket.description}</Typography>
                    </Box>
                    <Chip label={`${selectedBucket.groups.length} menu groups`} />
                  </Stack>
                </DialogTitle>
                <DialogContent dividers sx={{ bgcolor: "#f8fbff" }}>
                  <Grid container spacing={2}>
                    {selectedBucket.groups.map((group, index) => (
                      <Grid item xs={12} sm={6} md={4} key={group.title}>
                        <Card
                          elevation={0}
                          sx={{
                            height: "100%",
                            border: "1px solid #dbeafe",
                            borderRadius: 3,
                            background: "linear-gradient(180deg, #ffffff 0%, #f1f7ff 100%)",
                            transition: "transform 160ms ease, box-shadow 160ms ease",
                            "&:hover": { transform: "translateY(-3px)", boxShadow: "0 16px 36px rgba(37,99,235,0.12)" }
                          }}
                        >
                          <CardActionArea onClick={() => openGroup(group)} sx={{ height: "100%" }}>
                            <CardContent>
                              <Stack spacing={1.5}>
                                <Box
                                  sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 2,
                                    display: "grid",
                                    placeItems: "center",
                                    color: "#2563eb",
                                    bgcolor: "#dbeafe"
                                  }}
                                >
                                  {cardIcon(index)}
                                </Box>
                                <Typography variant="subtitle1" fontWeight={900}>{group.title}</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip size="small" label="Open" />
                                  <KeyboardArrowRight fontSize="small" />
                                </Stack>
                              </Stack>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setBucketDialogOpen(false)}>Close</Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </Stack>
      </Box>
    </MenuPageShell>
  );
}
