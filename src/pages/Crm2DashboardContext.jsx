import { createContext, useContext, useMemo } from 'react';
export const Crm2DashboardContext = createContext(null);
export function useCrm2Dashboard() {
  const context = useContext(Crm2DashboardContext);
  const year = new URLSearchParams(window.location.search).get('dashboardyear');
  return useMemo(() => context || (year ? { academicyear: year } : null), [context, year]);
}
