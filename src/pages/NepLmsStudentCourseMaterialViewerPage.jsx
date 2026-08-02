import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { Dashboard, Logout, PlayArrow, QuestionAnswer, Refresh } from "@mui/icons-material";
import ep1 from "../api/ep1";
import global1 from "./global1";

const uniqueSorted = (rows = []) => [...new Set(rows.map((item) => String(item || "").trim()).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b));
const orderValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.MAX_SAFE_INTEGER;
};
const sortMaterials = (rows = []) => [...rows].sort((a, b) => {
  const diff = orderValue(a.order) - orderValue(b.order);
  if (diff) return diff;
  return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
});
const getYouTubeId = (url = "") => {
  const value = String(url || "");
  const patterns = [
    /youtu\.be\/([^?&#/]+)/i,
    /youtube\.com\/watch\?[^#]*v=([^?&#]+)/i,
    /youtube\.com\/embed\/([^?&#/]+)/i,
    /youtube\.com\/shorts\/([^?&#/]+)/i
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return "";
};
const fileKind = (row = {}) => {
  const url = String(row.url || "");
  const mime = String(row.mimetype || "").toLowerCase();
  if (getYouTubeId(url)) return "youtube";
  if (mime.includes("video") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return "video";
  if (mime.includes("pdf") || /\.pdf(\?|$)/i.test(url)) return "pdf";
  if (mime.includes("image") || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)) return "image";
  return "frame";
};

function YouTubeViewer({ material, onProgress }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const videoId = getYouTubeId(material?.url);

  useEffect(() => {
    if (!videoId) return undefined;
    let cancelled = false;
    const ensureApi = () => new Promise((resolve) => {
      if (window.YT?.Player) return resolve();
      const existing = document.getElementById("youtube-iframe-api");
      window.onYouTubeIframeAPIReady = () => resolve();
      if (!existing) {
        const script = document.createElement("script");
        script.id = "youtube-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }
    });
    ensureApi().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current?.destroy?.();
      containerRef.current.innerHTML = "";
      const mount = document.createElement("div");
      mount.style.width = "100%";
      mount.style.height = "100%";
      containerRef.current.appendChild(mount);
      playerRef.current = new window.YT.Player(mount, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            timerRef.current = setInterval(() => {
              const player = playerRef.current;
              if (!player?.getCurrentTime) return;
              const watched = Number(player.getCurrentTime() || 0);
              const duration = Number(player.getDuration?.() || 0);
              if (watched > 0) onProgress(watched, duration);
            }, 5000);
          },
          onStateChange: () => {
            const player = playerRef.current;
            if (!player?.getCurrentTime) return;
            onProgress(Number(player.getCurrentTime() || 0), Number(player.getDuration?.() || 0));
          }
        }
      });
    });
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      try {
        playerRef.current?.destroy?.();
      } catch {
        // YouTube may already have replaced or detached its iframe.
      }
      playerRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [videoId, onProgress]);

  return <Box ref={containerRef} sx={{ width: "100%", height: "100%" }} />;
}

export default function NepLmsStudentCourseMaterialViewerPage({ facultyMode = false }) {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({ academicyear: "", regulation: "", program: "", programcode: "", semester: "", coursecode: "" });
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [progress, setProgress] = useState({});
  const [qa, setQa] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [sideTab, setSideTab] = useState(0);
  const [question, setQuestion] = useState("");
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const progressTimerRef = useRef(null);

  const selectedMaterial = useMemo(() => materials.find((item) => item._id === selectedId) || null, [materials, selectedId]);
  const currentKind = fileKind(selectedMaterial || {});
  const materialQa = useMemo(() => qa.filter((item) => String(item.materialid) === String(selectedId)), [qa, selectedId]);
  const isFacultyView = facultyMode || String(global1.role || "").toLowerCase() !== "student";
  const sortedMaterials = useMemo(() => sortMaterials(materials), [materials]);
  const filterOptions = useMemo(() => ({
    academicyears: uniqueSorted(courses.map((item) => item.academicyear)),
    regulations: uniqueSorted(courses.map((item) => item.regulation)),
    programs: uniqueSorted(courses.map((item) => item.program)),
    programcodes: uniqueSorted(courses.map((item) => item.programcode)),
    semesters: uniqueSorted(courses.map((item) => item.semester)),
    courses: courses.filter((item) => (
      (!filters.academicyear || item.academicyear === filters.academicyear)
      && (!filters.regulation || item.regulation === filters.regulation)
      && (!filters.program || item.program === filters.program)
      && (!filters.programcode || item.programcode === filters.programcode)
      && (!filters.semester || item.semester === filters.semester)
    ))
  }), [courses, filters]);

  const baseParams = (extra = {}) => ({
    colid: global1.colid,
    ...(facultyMode ? { facultyemail: global1.user, email: global1.user, name: global1.name } : { regno: global1.regno }),
    user: global1.user,
    ...extra
  });

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get(facultyMode ? "/api/v2/neplms/faculty-course-material-courses" : "/api/v2/neplms/student-workspace/courses", { params: baseParams() });
      const nextCourses = res.data?.courses || [];
      setStudent(res.data?.student || res.data?.faculty || { name: global1.name, email: global1.user });
      setCourses(nextCourses);
      const first = nextCourses[0];
      if (first) {
        setFilters({
          academicyear: first.academicyear || "",
          regulation: first.regulation || "",
          program: first.program || "",
          programcode: first.programcode || "",
          semester: first.semester || "",
          coursecode: first.coursecode || ""
        });
        setCourse(first);
      }
    } catch (err) {
      setError(err.response?.data?.message || (facultyMode ? "Unable to load faculty courses." : "Unable to load student courses."));
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async (nextCourse = course) => {
    if (!nextCourse) return;
    try {
      setLoading(true);
      setError("");
      const res = await ep1.get(facultyMode ? "/api/v2/neplms/faculty-course-materials" : "/api/v2/neplms/student-workspace/course-materials", {
        params: baseParams({
          academicyear: nextCourse.academicyear,
          regulation: nextCourse.regulation,
          program: nextCourse.program,
          programcode: nextCourse.programcode,
          semester: nextCourse.semester,
          coursecode: nextCourse.coursecode
        })
      });
      const nextMaterials = sortMaterials(res.data?.materials || []);
      setMaterials(nextMaterials);
      setQa(res.data?.qa || []);
      setProgress(Object.fromEntries((res.data?.progress || []).map((item) => [String(item.materialid), item])));
      setSelectedId((prev) => nextMaterials.some((item) => item._id === prev) ? prev : (nextMaterials[0]?._id || ""));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load course materials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { if (course) loadMaterials(course); }, [course?._id]);

  const selectCourseFromFilters = () => {
    const next = courses.find((item) => (
      (!filters.academicyear || item.academicyear === filters.academicyear)
      && (!filters.regulation || item.regulation === filters.regulation)
      && (!filters.program || item.program === filters.program)
      && (!filters.programcode || item.programcode === filters.programcode)
      && (!filters.semester || item.semester === filters.semester)
      && (!filters.coursecode || item.coursecode === filters.coursecode)
    ));
    if (!next) {
      setError("No assigned course found for the selected filters.");
      return;
    }
    setCourse(next);
  };

  const saveProgress = async (watchedseconds, durationseconds) => {
    if (facultyMode || !selectedMaterial?._id) return;
    const watched = Math.max(0, Math.floor(Number(watchedseconds || 0)));
    const duration = Math.max(0, Math.floor(Number(durationseconds || 0)));
    const prev = progress[String(selectedMaterial._id)] || {};
    if (watched <= Number(prev.watchedseconds || 0) && duration <= Number(prev.durationseconds || 0)) return;
    const watchedpercent = duration ? Math.min(100, Math.round((watched / duration) * 100)) : Number(prev.watchedpercent || 0);
    setProgress((old) => ({
      ...old,
      [String(selectedMaterial._id)]: { ...prev, watchedseconds: watched, durationseconds: duration, watchedpercent }
    }));
    try {
      await ep1.post("/api/v2/neplms/student-workspace/course-material-progress", baseParams({
        materialid: selectedMaterial._id,
        watchedseconds: watched,
        durationseconds: duration,
        watchedpercent
      }));
    } catch {
      // Best effort tracking; avoid interrupting the learner.
    }
  };

  const submitQuestion = async () => {
    if (!selectedMaterial) return setError("Select course material first.");
    if (!question.trim()) return setError("Please type a question.");
    try {
      setLoading(true);
      setError("");
      await ep1.post("/api/v2/neplms/student-workspace/course-material-question", baseParams({
        materialid: selectedMaterial._id,
        question
      }));
      setQuestion("");
      setMessage("Question submitted.");
      await loadMaterials(course);
      setSideTab(1);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit question.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (row) => {
    const answer = answerDrafts[row._id] || "";
    if (!answer.trim()) return;
    try {
      setLoading(true);
      await ep1.post("/api/v2/neplms/student-workspace/course-material-answer", {
        id: row._id,
        colid: global1.colid,
        answer,
        answeredby: global1.name,
        answeredbyemail: global1.user
      });
      setAnswerDrafts((prev) => ({ ...prev, [row._id]: "" }));
      await loadMaterials(course);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit answer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (currentKind !== "video") return undefined;
    progressTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && !Number.isNaN(video.currentTime)) saveProgress(video.currentTime, video.duration || 0);
    }, 5000);
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    };
  }, [currentKind, selectedId]);

  const renderViewer = () => {
    if (!selectedMaterial) {
      return <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", color: "grey.500" }}><Typography variant="h5" fontWeight={900}>Select course material</Typography></Stack>;
    }
    if (!selectedMaterial.url) {
      return <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", color: "grey.500" }}><Typography>No file or video attached</Typography></Stack>;
    }
    if (currentKind === "youtube") {
      return <YouTubeViewer material={selectedMaterial} onProgress={saveProgress} />;
    }
    if (currentKind === "video") {
      return (
        <Box
          component="video"
          ref={videoRef}
          src={selectedMaterial.url}
          controls
          controlsList="nodownload noplaybackrate"
          onTimeUpdate={(event) => saveProgress(event.currentTarget.currentTime, event.currentTarget.duration || 0)}
          onLoadedMetadata={(event) => saveProgress(event.currentTarget.currentTime, event.currentTarget.duration || 0)}
          sx={{ width: "100%", height: "100%", bgcolor: "#000" }}
        />
      );
    }
    if (currentKind === "image") {
      return <Box component="img" src={selectedMaterial.url} alt={selectedMaterial.title} sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />;
    }
    return <Box component="iframe" title={selectedMaterial.title || "Course material"} src={selectedMaterial.url} sx={{ width: "100%", height: "100%", border: 0, bgcolor: "#fff" }} />;
  };

  const renderFilters = () => (
    <Stack spacing={1.25}>
      <Autocomplete size="small" options={filterOptions.academicyears} value={filters.academicyear || null} onChange={(_, value) => setFilters((prev) => ({ ...prev, academicyear: value || "", coursecode: "" }))} renderInput={(params) => <TextField {...params} label="Academic year" />} />
      <Autocomplete size="small" options={filterOptions.regulations} value={filters.regulation || null} onChange={(_, value) => setFilters((prev) => ({ ...prev, regulation: value || "", coursecode: "" }))} renderInput={(params) => <TextField {...params} label="Regulation" />} />
      <Autocomplete size="small" options={filterOptions.programs} value={filters.program || null} onChange={(_, value) => setFilters((prev) => ({ ...prev, program: value || "", coursecode: "" }))} renderInput={(params) => <TextField {...params} label="Program" />} />
      <Autocomplete size="small" options={filterOptions.programcodes} value={filters.programcode || null} onChange={(_, value) => setFilters((prev) => ({ ...prev, programcode: value || "", coursecode: "" }))} renderInput={(params) => <TextField {...params} label="Program code" />} />
      <Autocomplete size="small" options={filterOptions.semesters} value={filters.semester || null} onChange={(_, value) => setFilters((prev) => ({ ...prev, semester: value || "", coursecode: "" }))} renderInput={(params) => <TextField {...params} label="Semester" />} />
      <Autocomplete
        size="small"
        options={filterOptions.courses}
        value={filterOptions.courses.find((item) => item.coursecode === filters.coursecode) || null}
        getOptionLabel={(option) => option ? `${option.course || ""} (${option.coursecode || ""})` : ""}
        onChange={(_, value) => setFilters((prev) => ({ ...prev, coursecode: value?.coursecode || "" }))}
        renderInput={(params) => <TextField {...params} label="Course" />}
      />
      <Button variant="contained" startIcon={<Refresh />} onClick={selectCourseFromFilters}>Load materials</Button>
    </Stack>
  );

  return (
    <Box sx={{ height: "100vh", bgcolor: "#eef3f8", overflow: "hidden" }}>
      <Paper square elevation={0} sx={{ px: 2.5, py: 1.25, bgcolor: "#0f172a", color: "#fff" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={950} noWrap>{facultyMode ? "Course Material Preview" : "Course Material"}</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.72)" }} noWrap>{student?.name || global1.name} {student?.regno ? `| ${student.regno}` : ""}</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button color="inherit" variant="outlined" startIcon={<Dashboard />} onClick={() => navigate(facultyMode ? "/facultydashboard" : "/studentdashboard")} sx={{ borderColor: "rgba(255,255,255,0.35)" }}>Home</Button>
            <Button color="inherit" variant="outlined" startIcon={<Logout />} onClick={() => { localStorage.clear(); window.location.href = "/"; }} sx={{ borderColor: "rgba(255,255,255,0.35)" }}>Logout</Button>
          </Stack>
        </Stack>
      </Paper>
      {loading && <LinearProgress />}
      <Box sx={{ height: "calc(100vh - 58px)", display: "flex", gap: 1.5, p: 1.5 }}>
        <Paper sx={{ width: "80%", minWidth: 0, overflow: "hidden", borderRadius: 2, display: "flex", flexDirection: "column" }}>
          <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography fontWeight={950}>{selectedMaterial?.title || "Course material viewer"}</Typography>
              {course && <Chip size="small" label={`${course.course || ""} (${course.coursecode || ""})`} />}
              {selectedMaterial?.module && <Chip size="small" variant="outlined" label={selectedMaterial.module} />}
              {selectedMaterial?.topic && <Chip size="small" variant="outlined" label={selectedMaterial.topic} />}
              {!facultyMode && selectedMaterial && <Chip size="small" color="success" label={`${progress[String(selectedMaterial._id)]?.watchedpercent || 0}% watched`} />}
            </Stack>
          </Box>
          {(error || message) && (
            <Box sx={{ p: 1.5, pb: 0 }}>
              {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
              {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
            </Box>
          )}
          <Box sx={{ flex: 1, minHeight: 0, bgcolor: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {renderViewer()}
          </Box>
        </Paper>

        <Paper sx={{ width: "20%", minWidth: 280, borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <Tabs value={sideTab} onChange={(_, value) => setSideTab(value)} variant="fullWidth">
            <Tab label="Materials" />
            <Tab label="Q&A" icon={<QuestionAnswer fontSize="small" />} iconPosition="start" />
          </Tabs>
          <Divider />
          <Box sx={{ p: 1.5, overflow: "auto", flex: 1 }}>
            {sideTab === 0 && (
              <Stack spacing={1.5}>
                {renderFilters()}
                <Divider />
                <Typography variant="subtitle2" fontWeight={950}>Course materials in order</Typography>
                <Stack spacing={1}>
                  {sortedMaterials.map((item) => {
                    const itemProgress = progress[String(item._id)] || {};
                    const active = item._id === selectedId;
                    return (
                      <Paper
                        key={item._id}
                        variant="outlined"
                        onClick={() => setSelectedId(item._id)}
                        sx={{
                          p: 1,
                          cursor: "pointer",
                          borderColor: active ? "primary.main" : "divider",
                          bgcolor: active ? "#eff6ff" : "#fff"
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <PlayArrow color={active ? "primary" : "disabled"} fontSize="small" />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" fontWeight={900}>{item.order ? `${item.order}. ` : ""}{item.title || item.originalname || "Course material"}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.module || "Module"} {item.topic ? `| ${item.topic}` : ""}</Typography>
                            {!facultyMode && (
                              <>
                                <LinearProgress variant="determinate" value={Number(itemProgress.watchedpercent || 0)} sx={{ mt: 0.75, height: 5, borderRadius: 1 }} />
                                <Typography variant="caption" color="text.secondary">{itemProgress.watchedpercent || 0}% watched</Typography>
                              </>
                            )}
                          </Box>
                        </Stack>
                      </Paper>
                    );
                  })}
                  {!sortedMaterials.length && <Alert severity="info">No course material uploaded for this course.</Alert>}
                </Stack>
              </Stack>
            )}
            {sideTab === 1 && (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={950}>{selectedMaterial?.title || "Select material"} Q&A</Typography>
                {!facultyMode && (
                  <>
                    <TextField fullWidth multiline minRows={3} label="Type your question" value={question} onChange={(e) => setQuestion(e.target.value)} />
                    <Button variant="contained" onClick={submitQuestion} disabled={!selectedMaterial || loading}>Submit question</Button>
                  </>
                )}
                <Divider />
                <Paper variant="outlined" sx={{ p: 1.2, bgcolor: "#f8fafc", borderColor: "divider" }}>
                  <Typography variant="body2" fontWeight={950}>{selectedMaterial?.title || "Material"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedMaterial?.module || "Module"}{selectedMaterial?.topic ? ` / ${selectedMaterial.topic}` : ""}
                  </Typography>
                  <Stack spacing={1.2} sx={{ mt: 1.2, pl: 1.4, borderLeft: "3px solid #bfdbfe" }}>
                    {materialQa.map((row) => (
                      <Paper key={row._id} variant="outlined" sx={{ p: 1.2, bgcolor: "#fff" }}>
                        <Stack spacing={0.75}>
                          <Box>
                            <Typography variant="caption" color="primary" fontWeight={900}>Question</Typography>
                            <Typography variant="body2" fontWeight={900}>{row.question}</Typography>
                            <Typography variant="caption" color="text.secondary">Asked by {row.student || row.regno} | {new Date(row.createdAt).toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ ml: 1.3, pl: 1.2, borderLeft: "2px solid #bbf7d0" }}>
                            <Typography variant="caption" color="success.main" fontWeight={900}>Answer</Typography>
                            {row.answer ? (
                              <Alert severity="success" sx={{ mt: 0.5 }}>
                                <Typography variant="body2">{row.answer}</Typography>
                                <Typography variant="caption">Answered by {row.answeredby || row.faculty || "Faculty"}</Typography>
                              </Alert>
                            ) : (
                              <Chip size="small" label="Waiting for faculty response" sx={{ mt: 0.5 }} />
                            )}
                            {isFacultyView && !row.answer && (
                              <Stack spacing={1} sx={{ mt: 1 }}>
                                <TextField size="small" multiline minRows={2} label="Faculty response" value={answerDrafts[row._id] || ""} onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [row._id]: e.target.value }))} />
                                <Button size="small" variant="outlined" onClick={() => submitAnswer(row)}>Respond</Button>
                              </Stack>
                            )}
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                    {!materialQa.length && <Alert severity="info">No questions yet for this material.</Alert>}
                  </Stack>
                  </Paper>
              </Stack>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export function NepLmsFacultyCourseMaterialPreviewPage() {
  return <NepLmsStudentCourseMaterialViewerPage facultyMode />;
}
