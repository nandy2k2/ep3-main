# Form Input Responsiveness

- Keep controlled draft inputs in an isolated editor component, below the page shell, navigation, reports and result grids. Do not debounce the visible input value or move ordinary typing into mutable refs.
- Memoize expensive sibling controls and result grids with stable callbacks, columns and options. A keystroke must not re-render the menu, a populated grid or unrelated cascading dropdowns.
- Keep search input local; perform requests on explicit Load or debounce only the request, never the displayed text. Cancel obsolete remote option requests.
- Save must consume the latest draft immediately, including when clicked directly after typing. Edit and reset must keep controlled inputs synchronized.
- For new or substantially changed data-entry pages, add a responsiveness regression test with a populated result grid: typing must not re-render navigation/results or trigger unrelated requests. Verify latest-value save, edit and reset behavior.
- AdmissionScholarshipEditor.jsx and AdmissionScholarshipMasterPage.test.jsx provide the current pattern and regression checks.
