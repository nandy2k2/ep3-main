import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { ArrowBack, Clear, Delete, Save } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import ep1 from "../api/ep1";
import global1 from "./global1";
import { menuitemsall } from "./menuall";

const emptyForm = {
  _id: "",
  menugroup: "",
  title: "",
  path: "",
  role: "",
  access: "Allow"
};

const PAGE_SELECT_ALL = "__ALL_PAGES__";
const ROLE_SELECT_ALL = "__ALL_ROLES__";

const flattenChildren = (children) => React.Children.toArray(children).filter(Boolean);

const getElementText = (node) => {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (!React.isValidElement(node)) {
    return "";
  }
  if (typeof node.props?.primary === "string") {
    return node.props.primary;
  }
  return flattenChildren(node.props?.children).map(getElementText).filter(Boolean).join(" ");
};

const findFirstPrimary = (node) => {
  if (!React.isValidElement(node)) {
    return "";
  }
  if (typeof node.props?.primary === "string") {
    return node.props.primary;
  }
  for (const child of flattenChildren(node.props?.children)) {
    const text = findFirstPrimary(child);
    if (text) return text;
  }
  return "";
};

const collectListItems = (node, pages = []) => {
  if (!React.isValidElement(node)) {
    return pages;
  }

  if (node.props?.to) {
    const title = findFirstPrimary(node);
    if (title) {
      pages.push({
        title,
        path: node.props.to
      });
    }
  }

  flattenChildren(node.props?.children).forEach((child) => collectListItems(child, pages));
  return pages;
};

const getActiveMenuPages = () => {
  const root = menuitemsall();
  const accordions = flattenChildren(root.props?.children);

  return accordions
    .map((accordion) => {
      const accordionChildren = flattenChildren(accordion.props?.children);
      const summary = accordionChildren[0];
      const details = accordionChildren[1];
      const group = getElementText(summary).trim();
      const pages = collectListItems(details);

      return {
        group,
        pages: pages.map((page) => ({
          ...page,
          group
        })).sort((a, b) => a.title.localeCompare(b.title))
      };
    })
    .filter((item) => item.group && item.pages.length)
    .sort((a, b) => a.group.localeCompare(b.group));
};

const MenuAccessControlPage = ({ embedded = false, onRowsChange }) => {
  const colid = global1.colid;
  const [form, setForm] = useState(emptyForm);
  const [selectedPagePaths, setSelectedPagePaths] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const menuGroups = useMemo(() => getActiveMenuPages(), []);
  const groupNames = useMemo(() => menuGroups.map((item) => item.group), [menuGroups]);
  const pagesForGroup = useMemo(
    () => menuGroups.find((item) => item.group === form.menugroup)?.pages || [],
    [menuGroups, form.menugroup]
  );

  const loadRules = async () => {
    if (!colid) {
      setError("College id is not available.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await ep1.get("/api/v2/menu-access", {
        params: { colid }
      });
      const nextRows = res.data?.data || [];
      setRows(nextRows);
      if (onRowsChange) onRowsChange(nextRows);
    } catch (err) {
      setError(err.response?.data?.message || "Error loading menu access rules");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await ep1.get("/api/v2/menu-access-roles", {
        params: { colid }
      });
      setRoles(res.data?.data || []);
    } catch (err) {
      setRoles([]);
    }
  };

  useEffect(() => {
    loadRules();
    loadRoles();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedPagePaths([]);
    setSelectedRoles([]);
    setMessage("");
    setError("");
  };

  const saveRule = async () => {
    const selectedPages = form._id
      ? [{ title: form.title, path: form.path }]
      : pagesForGroup.filter((page) => selectedPagePaths.includes(page.path));

    const rolesToSave = form._id ? [form.role].filter(Boolean) : selectedRoles.filter(Boolean);

    if (!form.menugroup || !selectedPages.length || !rolesToSave.length || !form.access) {
      setError("Please select group, page, role and Allow/Deny.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (form._id) {
        await ep1.post("/api/v2/menu-access-update", {
          id: form._id,
          colid,
          menugroup: form.menugroup,
          title: form.title,
          path: form.path,
          role: form.role,
          access: form.access,
          user: global1.user
        });
        setMessage("Menu access rule updated.");
      } else {
        const payloads = selectedPages.flatMap((page) => rolesToSave.map((role) => ({
          colid,
          menugroup: form.menugroup,
          title: page.title,
          path: page.path,
          role,
          access: form.access,
          user: global1.user
        })));
        await Promise.all(payloads.map((payload) => ep1.post("/api/v2/menu-access", payload)));
        setMessage(`${payloads.length} menu access rule${payloads.length === 1 ? "" : "s"} added.`);
      }
      setForm(emptyForm);
      setSelectedPagePaths([]);
      setSelectedRoles([]);
      await loadRules();
      await loadRoles();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving menu access rule");
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id) => {
    if (!window.confirm("Delete this menu access rule?")) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await ep1.post("/api/v2/menu-access-delete", { id });
      setMessage("Menu access rule deleted.");
      await loadRules();
      if (form._id === id) {
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting menu access rule");
    }
  };

  const selectPage = (pageTitle) => {
    const page = pagesForGroup.find((item) => item.title === pageTitle);
    setForm((prev) => ({
      ...prev,
      title: page?.title || "",
      path: page?.path || ""
    }));
  };

  const selectPages = (paths) => {
    setSelectedPagePaths(paths);
    const selectedPages = pagesForGroup.filter((page) => paths.includes(page.path));
    setForm((prev) => ({
      ...prev,
      title: selectedPages.map((page) => page.title).join(", "),
      path: selectedPages.map((page) => page.path).join(", ")
    }));
  };

  const editRule = (row) => {
    setForm({
      _id: row._id,
      menugroup: row.menugroup || "",
      title: row.title || "",
      path: row.path || "",
      role: row.role || "",
      access: row.access || "Allow"
    });
    setSelectedPagePaths(row.path ? [row.path] : []);
    setSelectedRoles(row.role ? [row.role] : []);
    setMessage("");
    setError("");
  };

  const columns = [
    { field: "menugroup", headerName: "Group", minWidth: 180, flex: 1 },
    { field: "title", headerName: "Page title", minWidth: 220, flex: 1 },
    { field: "path", headerName: "Path", minWidth: 220, flex: 1 },
    { field: "role", headerName: "Role", minWidth: 160, flex: 1 },
    { field: "access", headerName: "Access", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 190,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => editRule(params.row)}>
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<Delete />}
            onClick={() => deleteRule(params.row._id)}
          >
            Delete
          </Button>
        </Stack>
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ sm: "center" }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Menu Access Control
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select active pages from menuall and define Allow or Deny rules role-wise.
              </Typography>
            </Box>
            {!embedded && <Button
              component={RouterLink}
              to="/dashdashfacnew"
              variant="outlined"
              startIcon={<ArrowBack />}
              sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
            >
              Back
            </Button>}
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="menu-access-group-label">Group</InputLabel>
              <Select
                labelId="menu-access-group-label"
                label="Group"
                value={form.menugroup}
                onChange={(event) => {
                  setSelectedPagePaths([]);
                  setForm((prev) => ({
                    ...prev,
                    menugroup: event.target.value,
                    title: "",
                    path: ""
                  }));
                }}
              >
                {groupNames.map((group) => (
                  <MenuItem key={group} value={group}>{group}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="menu-access-page-label">Page</InputLabel>
              <Select
                labelId="menu-access-page-label"
                label="Page"
                multiple={!form._id}
                value={form._id ? form.title : selectedPagePaths}
                onChange={(event) => {
                  if (form._id) selectPage(event.target.value);
                  else {
                    const nextValue = typeof event.target.value === "string"
                      ? event.target.value.split(",")
                      : event.target.value;
                    if (nextValue.includes(PAGE_SELECT_ALL)) {
                      selectPages(
                        selectedPagePaths.length === pagesForGroup.length
                          ? []
                          : pagesForGroup.map((page) => page.path)
                      );
                    } else {
                      selectPages(nextValue);
                    }
                  }
                }}
                disabled={!form.menugroup}
                renderValue={(selected) => {
                  if (form._id) return selected;
                  const paths = Array.isArray(selected) ? selected : [];
                  if (paths.length === pagesForGroup.length && pagesForGroup.length) {
                    return "All pages";
                  }
                  return pagesForGroup
                    .filter((page) => paths.includes(page.path))
                    .map((page) => page.title)
                    .join(", ");
                }}
              >
                {!form._id && (
                  <MenuItem
                    value={PAGE_SELECT_ALL}
                    onClick={(event) => {
                      event.stopPropagation();
                      selectPages(
                        selectedPagePaths.length === pagesForGroup.length
                          ? []
                          : pagesForGroup.map((page) => page.path)
                      );
                    }}
                  >
                    <Checkbox
                      checked={pagesForGroup.length > 0 && selectedPagePaths.length === pagesForGroup.length}
                      indeterminate={selectedPagePaths.length > 0 && selectedPagePaths.length < pagesForGroup.length}
                    />
                    <ListItemText primary="Select all pages" />
                  </MenuItem>
                )}
                {pagesForGroup.map((page) => (
                  <MenuItem key={`${page.path}-${page.title}`} value={form._id ? page.title : page.path}>
                    {!form._id && <Checkbox checked={selectedPagePaths.includes(page.path)} />}
                    {!form._id ? <ListItemText primary={page.title} secondary={page.path} /> : page.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Path"
              value={form.path}
              fullWidth
              InputProps={{ readOnly: true }}
            />

            <Autocomplete
              multiple={!form._id}
              freeSolo={!form._id}
              disableCloseOnSelect={!form._id}
              fullWidth
              options={form._id ? roles : [ROLE_SELECT_ALL, ...roles]}
              value={form._id ? form.role : selectedRoles}
              getOptionLabel={(option) => option === ROLE_SELECT_ALL ? "Select all roles" : option}
              isOptionEqualToValue={(option, value) => option === value}
              onInputChange={(event, nextValue, reason) => {
                if (form._id && reason === "input") {
                  setForm((prev) => ({ ...prev, role: nextValue }));
                }
              }}
              onChange={(event, nextValue) => {
                if (form._id) {
                  setForm((prev) => ({ ...prev, role: nextValue || "" }));
                  setSelectedRoles(nextValue ? [nextValue] : []);
                  return;
                }

                const nextRoles = Array.isArray(nextValue) ? nextValue : [];
                if (nextRoles.includes(ROLE_SELECT_ALL)) {
                  const allSelected = roles.length > 0 && selectedRoles.length === roles.length;
                  const updatedRoles = allSelected ? [] : [...roles];
                  setSelectedRoles(updatedRoles);
                  setForm((prev) => ({ ...prev, role: updatedRoles.join(", ") }));
                  return;
                }

                const uniqueRoles = Array.from(new Set(nextRoles.filter(Boolean)));
                setSelectedRoles(uniqueRoles);
                setForm((prev) => ({ ...prev, role: uniqueRoles.join(", ") }));
              }}
              renderOption={(props, option, { selected }) => {
                const isSelectAll = option === ROLE_SELECT_ALL;
                const allRolesSelected = roles.length > 0 && selectedRoles.length === roles.length;
                const partialRolesSelected = selectedRoles.length > 0 && selectedRoles.length < roles.length;
                return (
                  <li {...props}>
                    {!form._id && (
                      <Checkbox
                        checked={isSelectAll ? allRolesSelected : selected}
                        indeterminate={isSelectAll ? partialRolesSelected : false}
                        sx={{ mr: 1 }}
                      />
                    )}
                    {isSelectAll ? "Select all roles" : option}
                  </li>
                );
              }}
              renderTags={(value) => {
                if (!Array.isArray(value)) return null;
                if (roles.length > 0 && value.length === roles.length) {
                  return "All roles";
                }
                return value.join(", ");
              }}
              renderInput={(params) => (
                <TextField {...params} label="Role" helperText={form._id ? "" : "Select one, select all, or type a new role."} />
              )}
            />

            <FormControl fullWidth>
              <InputLabel id="menu-access-status-label">Allow/Deny</InputLabel>
              <Select
                labelId="menu-access-status-label"
                label="Allow/Deny"
                value={form.access}
                onChange={(event) => setForm((prev) => ({ ...prev, access: event.target.value }))}
              >
                <MenuItem value="Allow">Allow</MenuItem>
                <MenuItem value="Deny">Deny</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={saveRule}
              disabled={saving}
            >
              {form._id ? "Update" : "Add"}
            </Button>
            <Button variant="outlined" startIcon={<Clear />} onClick={resetForm}>
              Clear
            </Button>
          </Stack>

          <Box sx={{ height: 540, width: "100%" }}>
            <DataGrid
              getRowId={(row) => row._id}
              rows={rows}
              columns={columns}
              loading={loading || saving}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } }
              }}
              slots={{ toolbar: GridToolbar }}
              disableRowSelectionOnClick
            />
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default MenuAccessControlPage;
