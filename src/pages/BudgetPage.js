import React, { useEffect, useState } from "react";
import { Box, Grid, TextField, Button, MenuItem, Tab, Tabs, Typography } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from 'react-router-dom';
import ep1 from '../api/ep1';
import global1 from "./global1";

export default function BudgetPage() {
  const academicYearOptions = ["2026-27", "2027-28", "2028-29", "2029-30", "2030-31"];
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [pastRows, setPastRows] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  const [form, setForm] = useState({
    academicyear: "2026-27",
    storeid: "",
    categoryid: "",
    itemname: "",
    quantity: "",
    price: ""
  });

  const colid = global1.colid;
  const role = global1.role;
  const navigate = useNavigate();

  const actorPayload = () => ({
    username: global1.name,
    useremail: global1.user,
    userdepartment: global1.department
  });

  useEffect(() => {
    loadMasters();
    loadBudgets();
  }, []);

  const loadMasters = async () => {
    const s = await ep1.get(`/indstore?colid=${colid}`);
    const c = await ep1.get(`/indcategory?colid=${colid}`);

    setStores(s.data);
    setCategories(c.data);
  };

  const loadBudgets = async () => {
    const res = await ep1.get(
      `/indbudget?colid=${colid}&role=${encodeURIComponent(role || "")}`
    );

    setRows(res.data);
  };

  const loadPastBudgets = async (storeid, academicyear = form.academicyear) => {
    if (!storeid) {
      setPastRows([]);
      return;
    }

    const res = await ep1.get(
      `/indbudget?colid=${colid}&storeid=${encodeURIComponent(storeid)}&academicyear=${encodeURIComponent(academicyear || "")}`
    );

    setPastRows(res.data);
  };

  // CREATE
  const saveBudget = async () => {
    await ep1.post("/indbudget", {
      ...form,
      colid,
      department: global1.department,
      institution: global1.insname,
      ...actorPayload(),
       // 🔥 ADD THESE TWO LINES
       quantityremaining: form.quantity,
       priceremaining: form.price
    });

    loadBudgets();
    loadPastBudgets(form.storeid);
  };

  // APPROVE
  const approve = async (id) => {
    await ep1.post(`/indbudget/approve/${id}`, { level: role, ...actorPayload() });
    loadBudgets();
  };

  // REJECT
  const reject = async (id) => {
    await ep1.post(`/indbudget/reject/${id}`, actorPayload());
    loadBudgets();
  };

  const canApprove = (status) => {
    return status === `${role}_PENDING`;
  };

  const columns = [
    {
      field: "store",
      headerName: "Store",
      width: 140,
      valueGetter: p => p.row.storeid?.storename
    },
    {
      field: "category",
      headerName: "Category",
      width: 140,
      valueGetter: p => p.row.categoryid?.categoryname
    },
    { field: "academicyear", headerName: "Academic Year", width: 140 },
    { field: "institution", headerName: "Institution", width: 150 },
    { field: "department", headerName: "Department", width: 150 },
    { field: "itemname", headerName: "Item", width: 150 },
    { field: "quantity", headerName: "Qty", width: 90 },
    { field: "price", headerName: "Price", width: 100 },
    { field: "status", headerName: "Status", width: 180 },

    {
      field: "approve",
      headerName: "Approve",
      width: 140,
      renderCell: (params) =>
        canApprove(params.row.status) ? (
          <Button onClick={() => approve(params.row._id)}>
            Approve
          </Button>
        ) : null
    },
    {
      field: "reject",
      headerName: "Reject",
      width: 120,
      renderCell: (params) =>
        canApprove(params.row.status) ? (
          <Button color="error" onClick={() => reject(params.row._id)}>
            Reject
          </Button>
        ) : null
    }
  ];

  const pastColumns = [
    ...columns.filter((column) => column.field !== "approve" && column.field !== "reject"),
    {
      field: "createdAt",
      headerName: "Created On",
      width: 170,
      valueGetter: p => p.row.createdAt ? new Date(p.row.createdAt).toLocaleDateString() : ""
    }
  ];

  return (
    <Box p={2}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashdashfacnew")}
        >
          Back
        </Button>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h5" fontWeight={600}>
          Budget management
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Tabs value={tabValue} onChange={(event, value) => setTabValue(value)}>
          <Tab label="New Budget" />
          <Tab label="Past budgets" />
        </Tabs>
      </Grid>

      {tabValue === 0 && (
        <>

      {/* ACADEMIC YEAR */}
      <Grid item xs={12} md={2}>
        <TextField
          select
          label="Academic Year"
          fullWidth
          value={form.academicyear}
          onChange={e => {
            const academicyear = e.target.value;
            setForm({ ...form, academicyear });
            loadPastBudgets(form.storeid, academicyear);
          }}
        >
          {academicYearOptions.map(year => (
            <MenuItem key={year} value={year}>{year}</MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* STORE */}
      <Grid item xs={12} md={2}>
        <TextField select label="Store" fullWidth
          value={form.storeid}
          onChange={e => {
            const storeid = e.target.value;
            setForm({ ...form, storeid });
            loadPastBudgets(storeid, form.academicyear);
          }}
        >
          {stores.map(s => (
            <MenuItem key={s._id} value={s._id}>{s.storename}</MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* CATEGORY */}
      <Grid item xs={12} md={2}>
        <TextField select label="Category" fullWidth
          value={form.categoryid}
          onChange={e => setForm({ ...form, categoryid: e.target.value })}
        >
          {categories.map(c => (
            <MenuItem key={c._id} value={c._id}>{c.categoryname}</MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* ITEM */}
      <Grid item xs={12} md={2}>
        <TextField label="Item" fullWidth
          value={form.itemname}
          onChange={e => setForm({ ...form, itemname: e.target.value })}
        />
      </Grid>

      {/* QTY */}
      <Grid item xs={12} md={2}>
        <TextField label="Qty" fullWidth
          value={form.quantity}
          onChange={e => setForm({ ...form, quantity: e.target.value })}
        />
      </Grid>

      {/* PRICE */}
      <Grid item xs={12} md={2}>
        <TextField label="Price" fullWidth
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
        />
      </Grid>

      {/* SUBMIT */}
      <Grid item xs={12} md={2}>
        <Button variant="contained" fullWidth onClick={saveBudget}>
          Submit
        </Button>
      </Grid>

      {/* GRID */}
      <Grid item xs={12} style={{ height: 500 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row._id}
          slots={{ toolbar: GridToolbar }}
        />
      </Grid>
        </>
      )}

      {tabValue === 1 && (
        <>
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Academic Year"
              fullWidth
              value={form.academicyear}
              onChange={e => {
                const academicyear = e.target.value;
                setForm({ ...form, academicyear });
                loadPastBudgets(form.storeid, academicyear);
              }}
            >
              {academicYearOptions.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Store"
              fullWidth
              value={form.storeid}
              onChange={e => {
                const storeid = e.target.value;
                setForm({ ...form, storeid });
                loadPastBudgets(storeid, form.academicyear);
              }}
            >
              {stores.map(s => (
                <MenuItem key={s._id} value={s._id}>{s.storename}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1">
              Past budgets for selected store
            </Typography>
          </Grid>

          <Grid item xs={12} style={{ height: 500 }}>
            <DataGrid
              rows={pastRows}
              columns={pastColumns}
              getRowId={(row) => row._id}
              slots={{ toolbar: GridToolbar }}
            />
          </Grid>
        </>
      )}

      </Grid>
    </Box>
  );
}
