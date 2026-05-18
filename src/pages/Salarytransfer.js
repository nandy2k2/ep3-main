import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import ep1 from "../api/ep1";
import global1 from "./global1";

export default function GenerateSalary() {
  const [colid] = useState(global1.colid);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [summaryRows, setSummaryRows] = useState([]);
  const [detailRows, setDetailRows] = useState([]);
  const [selectedEmpid, setSelectedEmpid] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = [
    "2026-27", "2025-26", "2024-25", "2023-24", "2022-23", "2021-22"
  ];

  const selectedEmployeeDetails = useMemo(() => {
    if (!selectedEmpid) {
      return [];
    }
    return detailRows.filter((row) => row.empid === selectedEmpid);
  }, [detailRows, selectedEmpid]);

  const selectedEmployee = useMemo(
    () => summaryRows.find((row) => row.empid === selectedEmpid),
    [summaryRows, selectedEmpid]
  );

  const handleGenerate = async () => {
    if (!month || !year) {
      setError("Please select month and year.");
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setSelectedEmpid('');
    try {
      const res = await ep1.post('/generate-salary', {
        colid,
        month,
        year
      });

      const nextSummary = res.data.summary || [];
      const nextDetails = res.data.details || [];
      setSummaryRows(nextSummary);
      setDetailRows(nextDetails);
      setMessage(`${res.data.message} (${res.data.count} records)`);
      if (nextSummary.length > 0) {
        setSelectedEmpid(nextSummary[0].empid);
      }
    } catch (err) {
      setSummaryRows([]);
      setDetailRows([]);
      setError(err.response?.data?.message || "Error generating salary");
    } finally {
      setLoading(false);
    }
  };

  const moneyFormatter = (params) => Number(params.value || 0).toLocaleString('en-IN');

  const summaryColumns = [
    { field: 'employee', headerName: 'Employee', minWidth: 220, flex: 1 },
    { field: 'empid', headerName: 'Employee userid', minWidth: 190, flex: 1 },
    { field: 'structure', headerName: 'Structure', minWidth: 260, flex: 1 },
    { field: 'components', headerName: 'Components', width: 130, type: 'number' },
    { field: 'earnings', headerName: 'Earnings', width: 140, type: 'number', valueFormatter: moneyFormatter },
    { field: 'deductions', headerName: 'Deductions', width: 150, type: 'number', valueFormatter: moneyFormatter },
    { field: 'total', headerName: 'Total', width: 140, type: 'number', valueFormatter: moneyFormatter }
  ];

  const detailColumns = [
    { field: 'component', headerName: 'Component', minWidth: 180, flex: 1 },
    { field: 'amount', headerName: 'Amount', width: 140, type: 'number', valueFormatter: moneyFormatter },
    { field: 'type', headerName: 'Type', width: 140 },
    { field: 'level', headerName: 'Level', width: 120 },
    { field: 'structure', headerName: 'Structure', minWidth: 240, flex: 1 },
    { field: 'month', headerName: 'Month', width: 130 },
    { field: 'year', headerName: 'Year', width: 120 },
    { field: 'paystatus', headerName: 'Pay status', width: 140 }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Generate Salary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Salary is populated only from employee salary structure rows where level is Active.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/dashdashfacnew"
              variant="outlined"
              startIcon={<ArrowBack />}
              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
            >
              Back
            </Button>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Select
              fullWidth
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">Select Month</MenuItem>
              {months.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>

            <Select
              fullWidth
              value={year}
              onChange={(e) => setYear(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">Select Year</MenuItem>
              {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>

            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={loading}
              sx={{ minWidth: 180 }}
            >
              {loading ? "Generating..." : "Generate Salary"}
            </Button>
          </Stack>

          <Box>
            <Typography variant="h6" gutterBottom>
              Employee Salary Summary
            </Typography>
            <Box sx={{ height: 430, width: '100%' }}>
              <DataGrid
                getRowId={(row) => row.id}
                rows={summaryRows}
                columns={summaryColumns}
                loading={loading}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } }
                }}
                slots={{ toolbar: GridToolbar }}
                onRowClick={(params) => setSelectedEmpid(params.row.empid)}
                disableRowSelectionOnClick
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              {selectedEmployee ? `Salary Details - ${selectedEmployee.employee}` : 'Salary Details'}
            </Typography>
            <Box sx={{ height: 360, width: '100%' }}>
              <DataGrid
                getRowId={(row) => row._id}
                rows={selectedEmployeeDetails}
                columns={detailColumns}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } }
                }}
                slots={{ toolbar: GridToolbar }}
                disableRowSelectionOnClick
              />
            </Box>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
