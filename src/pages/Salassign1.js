import React, { useEffect, useState } from 'react';
import {
    Alert, Box, Button, Container, Paper, Stack, TextField, Typography
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

import ep1 from "../api/ep1";
import global1 from "./global1";

export default function SalAssign1() {

    const [employees, setEmployees] = useState([]);
    const [structures, setStructures] = useState([]);

    const [employee, setEmployee] = useState(null);
    const [structure, setStructure] = useState(null);
    const [effectiveDate, setEffectiveDate] = useState('');
    const [appliedDate, setAppliedDate] = useState('');
    const [salaryRows, setSalaryRows] = useState([]);
    const [loadingSalary, setLoadingSalary] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const colid = global1.colid;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const emp = await ep1.get(`/sal/employees?colid=${colid}`);
            const str = await ep1.get(`/sal/structures?colid=${colid}`);
            setEmployees(emp.data);
            setStructures(str.data);
        } catch (err) {
            console.error(err);
            setError('Error loading data');
        }
    };

    const loadEmployeeSalaryStructure = async (selectedEmployee) => {
        if (!selectedEmployee?._id) {
            setSalaryRows([]);
            return;
        }

        setLoadingSalary(true);
        setError('');
        try {
            const res = await ep1.get('/sal/employee-structure', {
                params: {
                    colid,
                    employeeid: selectedEmployee._id
                }
            });
            setSalaryRows(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Error loading employee salary structure');
            setSalaryRows([]);
        } finally {
            setLoadingSalary(false);
        }
    };

    const assignSalary = async () => {
        if (!employee || !structure) {
            setError('Please select both Employee and Structure');
            return;
        }

        try {
            await ep1.post('/sal/assign', {
                employeeid: employee._id,
                structureid: structure._id,
                colid,
                effectivedate: effectiveDate,
                applieddate: appliedDate
            });

            setMessage('Salary assigned successfully');
            setError('');
            setStructure(null);
            await loadEmployeeSalaryStructure(employee);
        } catch (err) {
            setError('Error assigning salary');
        }
    };

    const columns = [
        { field: 'structure', headerName: 'Structure', minWidth: 220, flex: 1 },
        { field: 'employee', headerName: 'Employee', minWidth: 180, flex: 1 },
        { field: 'empid', headerName: 'Employee userid', minWidth: 180, flex: 1 },
        { field: 'component', headerName: 'Component', minWidth: 160, flex: 1 },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 130,
            type: 'number',
            valueFormatter: (params) => Number(params.value || 0).toLocaleString('en-IN')
        },
        { field: 'type', headerName: 'Type', width: 130 },
        { field: 'level', headerName: 'Level', width: 140 },
        {
            field: 'effectivedate',
            headerName: 'Effective date',
            width: 160,
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
        },
        {
            field: 'applieddate',
            headerName: 'Applied date',
            width: 160,
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
        }
    ];

    return (
        <Container sx={{ mt: 4 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Stack spacing={3}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                        <Box>
                            <Typography variant="h5" gutterBottom>
                                Assign Salary Structure
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Assign a salary structure and review the selected employee salary components.
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

                    <Autocomplete
                        options={employees}
                        getOptionLabel={(option) => option.name || ''}
                        value={employee}
                        onChange={(e, newValue) => {
                            setEmployee(newValue);
                            setMessage('');
                            loadEmployeeSalaryStructure(newValue);
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Select Employee" fullWidth />
                        )}
                    />

                    <Autocomplete
                        options={structures}
                        getOptionLabel={(option) => option.struture || ''}
                        value={structure}
                        onChange={(e, newValue) => {
                            setStructure(newValue);
                            setMessage('');
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Select Structure" fullWidth />
                        )}
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Effective date"
                            type="date"
                            value={effectiveDate}
                            onChange={(event) => setEffectiveDate(event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label="Applied date"
                            type="date"
                            value={appliedDate}
                            onChange={(event) => setAppliedDate(event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Stack>

                    <Box>
                        <Button variant="contained" onClick={assignSalary}>
                            Assign
                        </Button>
                    </Box>

                    <Box sx={{ height: 430, width: '100%' }}>
                        <DataGrid
                            getRowId={(row) => row._id}
                            rows={salaryRows}
                            columns={columns}
                            loading={loadingSalary}
                            pageSizeOptions={[10, 25, 50]}
                            initialState={{
                                pagination: {
                                    paginationModel: {
                                        pageSize: 10,
                                        page: 0
                                    }
                                }
                            }}
                            slots={{ toolbar: GridToolbar }}
                            disableRowSelectionOnClick
                        />
                    </Box>
                </Stack>
            </Paper>
        </Container>
    );
}
