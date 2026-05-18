import React, { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Stack, TextField, Autocomplete
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
// import Papa from "papaparse";
import ep1 from '../api/ep1';
import global1 from './global1';
import readXlsxFile from "read-excel-file";

const roles = ["Admin", "crm", "Faculty", "HOD", "REGISTRAR","ACCOUNTS","MANAGEMENT", "HOI"];
const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "",
  institution: "",
  department: "",
  admissionyear: ""
};

export default function MbUserPage({ embedded = false, onRowsChange }) {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState("");
  const navigate = useNavigate();
  const colid = global1.colid; // global1.colid later

  const fetchData = async () => {
    const res = await ep1.get(`/mbusers?colid=${colid}`);
    const nextRows = res.data || [];
    setRows(nextRows);
    if (onRowsChange) onRowsChange(nextRows);
  };

  useEffect(() => {
    fetchData();
  }, []);

//   const handleSave = async () => {
//     await ep1.post("/mbusers", {
//       ...form,
//       colid
//     });
//     setOpen(false);
//     fetchData();
//   };

const openAddDialog = () => {
  setEditId("");
  setForm(emptyForm);
  setOpen(true);
};

const openEditDialog = (row) => {
  setEditId(row._id);
  setForm({
    name: row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    password: row.password || "",
    role: row.role || "",
    institution: row.institution || "",
    department: row.department || "",
    admissionyear: row.admissionyear || ""
  });
  setOpen(true);
};

const handleClose = () => {
  setOpen(false);
  setEditId("");
  setForm(emptyForm);
};

const handleSave = async () => {
  const payload = {
    ...form,
    user: global1.user,
    colid: global1.colid
  };

  if (editId) {
    await ep1.post("/mbusers-update", { ...payload, id: editId });
  } else {
    await ep1.post("/mbusers", payload);
  }

  handleClose();
  fetchData();
};

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await ep1.post("/mbusers-delete", { id });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
  };

  // ✅ Bulk upload
//   const handleFileUpload = (e) => {
//     Papa.parse(e.target.files[0], {
//       header: true,
//       complete: async (results) => {
//         await axios.post("http://localhost:5000/mbusers/bulk",
//           results.data.map(r => ({ ...r, colid }))
//         );
//         fetchData();
//       }
//     });
//   };

// const handleFileUpload = async (e) => {
//   const file = e.target.files[0];

//   const rows = await readXlsxFile(file);

//   // remove header row
//   const data = rows.slice(1);

//   const mapped = data.map((row) => ({
//     name: row[0],
//     email: row[1],
//     phone: row[2],
//     password: row[3],
//     role: row[4],
//     institution: row[5],
//     department: row[6],
//     joiningyear: row[7]
//   }));

//   await ep1.post(
//     "/mbusers/bulk",
//     mapped,
//     {
//       headers: {
//         "x-user": global1.user,
//         "x-colid": global1.colid
//       }
//     }
//   );

//   fetchData();
// };

const handleFileUpload = async (e) => {
  const file = e.target.files[0];

  const rows = await readXlsxFile(file);
  const data = rows.slice(1);

  const mapped = data.map((row) => ({
    name: row[0],
    email: row[1],
    phone: row[2],
    password: row[3],
    role: row[4],
    institution: row[5],
    department: row[6],
    joiningyear: row[7],

    // 🔑 inject here
    user: global1.user,
    colid: global1.colid
  }));

  await ep1.post("/mbusers/bulk", mapped);

  fetchData();
};

  const columns = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "password", headerName: "Password", flex: 1 },
    { field: "phone", headerName: "Phone", flex: 1 },
    { field: "role", headerName: "Role", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "lastlogin", headerName: "Last login", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => openEditDialog(params.row)}>
            Edit
          </Button>
          <Button size="small" color="error" onClick={() => handleDelete(params.row._id)}>
            Delete
          </Button>
        </Stack>
      )
    }
  ];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <h2>User Management</h2>
        {!embedded && <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashdashfacnew")}
        >
          Back
        </Button>}
      </Box>

      <Box mb={2} display="flex" gap={2}>
        <Button variant="contained" onClick={openAddDialog}>
          Add User
        </Button>

        <Button variant="outlined" component="label">
          Upload Excel
          <input type="file" hidden onChange={handleFileUpload} />
        </Button>
      </Box>

      <Box mb={2} display="flex" gap={2}>
        <p>
            Format of excel file - name, email, phone, password, role, institution, department, joiningyear
        </p>
      </Box>


      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r._id}
        autoHeight
        slots={{ toolbar: GridToolbar }}
      />

      {/* Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? "Edit User" : "Add User"}</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth margin="dense"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <TextField label="Email" fullWidth margin="dense"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <TextField label="Phone" fullWidth margin="dense"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <TextField label="Password" fullWidth margin="dense"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

           <TextField label="Institution" fullWidth margin="dense"
            value={form.institution}
            onChange={(e) => setForm({ ...form, institution: e.target.value })}
          />

           <TextField label="Department" fullWidth margin="dense"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />

          <TextField label="Joining year" fullWidth margin="dense"
            value={form.admissionyear}
            onChange={(e) => setForm({ ...form, admissionyear: e.target.value })}
          />

          <Autocomplete
            freeSolo
            options={roles}
            value={form.role || ""}
            onChange={(event, value) => setForm({ ...form, role: value || "" })}
            onInputChange={(event, value) => setForm({ ...form, role: value || "" })}
            renderInput={(params) => (
              <TextField {...params} label="Role" fullWidth margin="dense" />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editId ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
