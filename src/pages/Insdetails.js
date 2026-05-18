import React, { useEffect, useState } from 'react';
import { Button, Grid, TextField } from '@mui/material';
import ep1 from '../api/ep1';
import global1 from './global1';
import { DataGrid } from '@mui/x-data-grid';

export default function InstitutionPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  const fetchData = async () => {
    const res = await ep1.get(`/api/institution?colid=${global1.colid}`);
    setRows(res.data.map(r => ({ ...r, id: r._id })));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    const payload = { ...form, colid: global1.colid };

    if (editId) {
      await ep1.post(`/api/institutionup/${editId}`, payload);
    } else {
      await ep1.post('/api/institution', payload);
    }

    setForm({});
    setEditId(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    await ep1.post(`/api/institutiondel/${id}`);
    fetchData();
  };

  const handleEdit = (row) => {
    setForm(row);
    setEditId(row.id);
  };

  const columns = [
    { field: 'institutionname', headerName: 'Institution', width: 200 },
    { field: 'address', headerName: 'Address', width: 200 },
    { field: 'presidentname', headerName: 'President', width: 150 },
    { field: 'vcname', headerName: 'VC', width: 150 },
    { field: 'registrarname', headerName: 'Registrar', width: 150 },
    {
      field: 'edit', headerName: 'Edit', renderCell: (params) => (
        <Button onClick={() => handleEdit(params.row)}>Edit</Button>
      )
    },
    {
      field: 'delete', headerName: 'Delete', renderCell: (params) => (
        <Button color="error" onClick={() => handleDelete(params.row.id)}>Delete</Button>
      )
    }
  ];

  return (
    <Grid container spacing={2} padding={2}>

      <Grid item xs={12}>
        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight
          pageSize={5}
          rowsPerPageOptions={[5, 10]}
        />
      </Grid>

      <Grid item xs={12}>
        <h3>{editId ? 'Update Institution' : 'Add Institution'}</h3>
        <Grid container spacing={2}>
          {['institutionname','logolink','address','presidentname','vcname','registrarname'].map(field => (
            <Grid item xs={3} key={field}>
              <TextField
                fullWidth
                label={field}
                value={form[field] || ''}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
              />
            </Grid>
          ))}
        </Grid>
        <Button variant="contained" onClick={handleSubmit}>
          {editId ? 'Update' : 'Save'}
        </Button>
      </Grid>
    </Grid>
  );
}