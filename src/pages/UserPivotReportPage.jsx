import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { Add, Delete, FilterAlt, Print, Refresh, Search } from "@mui/icons-material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis
} from "recharts";
import ep1 from "../api/ep1";
import global1 from "./global1";

const defaultFields = [
  { field: "academicyear", label: "Academic Year" },
  { field: "role", label: "Role" },
  { field: "program", label: "Program" },
  { field: "programcode", label: "Program Code" },
  { field: "category", label: "Category" },
  { field: "gender", label: "Gender" },
  { field: "department", label: "Department" },
  { field: "semester", label: "Semester" }
];
const defaultPivotFields = ["role", "programcode"];
const blankFilter = { field: "academicyear", operator: "equals", value: "" };
const operatorOptions = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "notempty", label: "Is not empty" }
];
const palette = ["#2563eb", "#16a34a", "#f97316", "#a855f7", "#dc2626", "#0891b2", "#ca8a04", "#475569", "#db2777", "#059669"];
const text = (value) => String(value ?? "").trim();

export default function UserPivotReportPage() {
  const colid = useMemo(() => global1.colid, []);
  const [filters, setFilters] = useState([{ ...blankFilter }]);
  const [fields, setFields] = useState(defaultFields);
  const [pivotFields, setPivotFields] = useState(defaultPivotFields);
  const [groupTogether, setGroupTogether] = useState(false);
  const [options, setOptions] = useState({});
  const [report, setReport] = useState({ total: 0, pivotRows: [], selectedFilters: [], pivotFields: defaultPivotFields, institution: null, grouped: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOptions();
    generateReport([{ ...blankFilter, value: "" }], defaultPivotFields, false);
  }, []);

  const fieldLabel = (field) => fields.find((item) => item.field === field)?.label || field;
  const fieldObject = (field) => fields.find((item) => item.field === field) || { field, label: fieldLabel(field) };
  const selectedFieldObjects = pivotFields.map(fieldObject);

  const loadOptions = async () => {
    try {
      const res = await ep1.get("/api/v2/user-pivot-report/options", { params: { colid } });
      const availableFields = res.data?.fields?.length ? res.data.fields : defaultFields;
      setFields(availableFields);
      setOptions(res.data?.options || {});
      setPivotFields((prev) => prev.filter((field) => availableFields.some((item) => item.field === field)).length ? prev : defaultPivotFields);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load filter options");
    }
  };

  const cleanFilters = (sourceFilters = filters) =>
    sourceFilters
      .map((filter) => ({
        field: filter.field,
        operator: filter.operator || "equals",
        value: text(filter.value)
      }))
      .filter((filter) => filter.field && (filter.operator === "notempty" || filter.value));

  const cleanPivotFields = (sourceFields = pivotFields) => [...new Set(sourceFields.filter(Boolean))];

  const generateReport = async (sourceFilters = filters, sourcePivotFields = pivotFields, sourceGroupTogether = groupTogether) => {
    const selectedPivots = cleanPivotFields(sourcePivotFields);
    if (!selectedPivots.length) {
      setError("Select at least one field for the pivot.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await ep1.post("/api/v2/user-pivot-report", {
        colid,
        filters: cleanFilters(sourceFilters),
        pivotFields: selectedPivots,
        groupTogether: sourceGroupTogether
      });
      setReport({
        total: res.data?.total || 0,
        pivotRows: res.data?.pivotRows || [],
        selectedFilters: res.data?.selectedFilters || [],
        pivotFields: res.data?.pivotFields || selectedPivots,
        grouped: !!res.data?.grouped,
        institution: res.data?.institution || null
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate user pivot report");
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (index, key, value) => {
    setFilters((prev) =>
      prev.map((filter, itemIndex) => {
        if (itemIndex !== index) return filter;
        const next = { ...filter, [key]: value };
        if (key === "field") next.value = "";
        if (key === "operator" && value === "notempty") next.value = "";
        return next;
      })
    );
  };

  const addFilter = () => setFilters((prev) => [...prev, { ...blankFilter }]);
  const removeFilter = (index) => setFilters((prev) => (prev.length === 1 ? [{ ...blankFilter }] : prev.filter((_, itemIndex) => itemIndex !== index)));
  const resetFilters = () => {
    const nextFilters = [{ ...blankFilter }];
    const nextFields = defaultPivotFields;
    setFilters(nextFilters);
    setPivotFields(nextFields);
    setGroupTogether(false);
    generateReport(nextFilters, nextFields, false);
  };

  const gridRows = useMemo(() => {
    if (!report.grouped) return report.pivotRows || [];
    return (report.pivotRows || []).map((row, index) => ({
      id: row.id || index,
      ...row.values,
      value: row.value,
      count: row.count
    }));
  }, [report]);

  const pivotColumns = useMemo(() => {
    if (report.grouped) {
      return [
        ...(report.pivotFields || []).map((field) => ({ field, headerName: fieldLabel(field), width: 170 })),
        { field: "count", headerName: "Total Count", width: 140, type: "number" }
      ];
    }
    return [
      { field: "fieldLabel", headerName: "Pivot Field", width: 210 },
      { field: "value", headerName: "Value", width: 300 },
      { field: "count", headerName: "Total Count", width: 140, type: "number" }
    ];
  }, [report, fields]);

  const chartData = useMemo(() => {
    const rows = report.grouped
      ? (report.pivotRows || []).map((row) => ({ name: row.value || "Not specified", count: row.count || 0 }))
      : (report.pivotRows || []).map((row) => ({ name: `${row.fieldLabel}: ${row.value}`, count: row.count || 0 }));
    return rows.sort((a, b) => b.count - a.count).slice(0, 12);
  }, [report]);

  const topRows = [...(report.pivotRows || [])].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 4);
  const institutionName = report.institution?.institutionname || global1.insname || "Institution";
  const logo = report.institution?.logolink || global1.logo || "";

  const CardBox = ({ label, value, color }) => (
    <Grid item xs={12} sm={6} md={3}>
      <Card sx={{ borderRadius: 2, border: `1px solid ${color}33`, bgcolor: `${color}12` }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h4" fontWeight={900} sx={{ color }}>{value}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #user-pivot-print, #user-pivot-print * { visibility: visible; }
          #user-pivot-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .screen-only { display: none !important; }
          .MuiDataGrid-toolbarContainer, .MuiDataGrid-footerContainer { display: none !important; }
        }
      `}</style>

      <Box className="screen-only">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>User Pivot Report</Typography>
            <Typography variant="body2" color="text.secondary">Select User fields, add User filters, and generate pivot summaries with charts.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()}>Print</Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Autocomplete
                multiple
                options={fields}
                value={selectedFieldObjects}
                getOptionLabel={(option) => option.label || option.field || ""}
                isOptionEqualToValue={(option, value) => option.field === value.field}
                onChange={(_, value) => setPivotFields(value.map((item) => item.field))}
                renderInput={(params) => <TextField {...params} label="Select one or more User fields for pivot" size="small" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ height: "100%" }}>
                <FormControlLabel control={<Checkbox checked={groupTogether} onChange={(event) => setGroupTogether(event.target.checked)} />} label="Group selected fields together" />
                <Button variant="contained" startIcon={<Search />} disabled={loading} onClick={() => generateReport()}>Generate</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterAlt color="primary" />
              <Typography variant="h6">Dynamic Filters</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<Add />} onClick={addFilter}>Add Filter</Button>
              <Button variant="outlined" startIcon={<Refresh />} onClick={resetFilters}>Reset</Button>
            </Stack>
          </Stack>

          <Stack spacing={1.5}>
            {filters.map((filter, index) => (
              <Grid container spacing={1.5} alignItems="center" key={`${filter.field}-${index}`}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Field</InputLabel>
                    <Select label="Field" value={filter.field} onChange={(event) => updateFilter(index, "field", event.target.value)}>
                      {fields.map((item) => <MenuItem key={item.field} value={item.field}>{item.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Condition</InputLabel>
                    <Select label="Condition" value={filter.operator} onChange={(event) => updateFilter(index, "operator", event.target.value)}>
                      {operatorOptions.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    freeSolo
                    size="small"
                    options={options[filter.field]?.values || []}
                    value={filter.value || ""}
                    disabled={filter.operator === "notempty"}
                    onInputChange={(_, value) => updateFilter(index, "value", value)}
                    onChange={(_, value) => updateFilter(index, "value", value || "")}
                    renderInput={(params) => <TextField {...params} label={filter.operator === "notempty" ? "Value not required" : fieldLabel(filter.field)} />}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Tooltip title="Remove filter">
                    <span>
                      <IconButton color="error" onClick={() => removeFilter(index)} disabled={filters.length === 1}>
                        <Delete />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Grid>
              </Grid>
            ))}
          </Stack>
        </Paper>
      </Box>

      <Box id="user-pivot-print" sx={{ bgcolor: "white", color: "#111827", p: 2 }}>
        <Stack alignItems="center" spacing={0.5} sx={{ mb: 2, textAlign: "center" }}>
          {logo && <Box component="img" src={logo} alt="Logo" sx={{ width: 72, height: 72, objectFit: "contain" }} />}
          <Typography variant="h6" fontWeight={800}>{institutionName}</Typography>
          <Typography variant="body2" sx={{ maxWidth: 760 }}>{report.institution?.address || ""}</Typography>
          <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 1 }}>User Pivot Report</Typography>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <CardBox label="Total Users" value={report.total} color="#2563eb" />
          <CardBox label="Pivot Fields" value={(report.pivotFields || []).length} color="#16a34a" />
          <CardBox label="Report Rows" value={report.pivotRows.length} color="#f97316" />
          <CardBox label="Filters Applied" value={report.selectedFilters.length} color="#a855f7" />
        </Grid>

        {!!topRows.length && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {topRows.map((row, index) => (
              <CardBox key={row.id || index} label={report.grouped ? row.value : `${row.fieldLabel}: ${row.value}`} value={row.count} color={palette[index % palette.length]} />
            ))}
          </Grid>
        )}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {(report.pivotFields || []).map((field) => <Chip key={field} label={`Pivot: ${fieldLabel(field)}`} />)}
          {report.selectedFilters.map((filter, index) => (
            <Chip key={`${filter.field}-${index}`} label={`${fieldLabel(filter.field)} ${filter.operator}: ${filter.operator === "notempty" ? "Not empty" : filter.value}`} />
          ))}
        </Stack>

        <Grid container spacing={2} sx={{ mb: 2 }} className="screen-only">
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: 360 }}>
              <Typography fontWeight={800} sx={{ mb: 1 }}>Top Pivot Counts</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip />
                  <Legend />
                  <Bar dataKey="count" name="Users" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 360 }}>
              <Typography fontWeight={800} sx={{ mb: 1 }}>Share</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie data={chartData.slice(0, 8)} dataKey="count" nameKey="name" outerRadius={105} label>
                    {chartData.slice(0, 8).map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ p: 1, overflowX: "auto", "@media print": { boxShadow: "none", border: "1px solid #cbd5e1" } }}>
          <DataGrid
            rows={gridRows}
            columns={pivotColumns}
            loading={loading}
            autoHeight
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "user_pivot_report" } } }}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            sx={{
              minWidth: 720,
              "& .MuiDataGrid-cell": { whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.35, py: 1 },
              "@media print": { border: "none" }
            }}
          />
        </Paper>
      </Box>
    </Container>
  );
}
