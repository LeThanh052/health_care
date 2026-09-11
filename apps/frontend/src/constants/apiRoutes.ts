const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export const API_ROUTES = {
    AUTH_ME: `${API_BASE}/auth/me`,
    LOGIN: `${API_BASE}/auth/login`,
    LOGOUT: `${API_BASE}/auth/logout`,
    FACILITY_SETTINGS: `${API_BASE}/facility/settings`,
    CARE_LEVELS: `${API_BASE}/care-levels`,
    STAFFING_RATIOS: `${API_BASE}/staffing-ratios`,
    RESIDENTS: `${API_BASE}/residents`,
    CARE_PLANS: `${API_BASE}/care-plans`,
    MEDICATIONS: `${API_BASE}/medications`,
    DOCTOR_SCHEDULES: `${API_BASE}/doctor-schedules`,
    EQUIPMENT_SUPPLIES: `${API_BASE}/equipment-supplies`,
    INCIDENT_SEVERITIES: `${API_BASE}/incident-severities`,
    SLA_CONFIGURATIONS: `${API_BASE}/sla-configurations`,
    DASHBOARD_NURSE: "/dashboard/nurse",
    DASHBOARD_DON: "/dashboard/don",
    DASHBOARD_CNA: "/dashboard/cna",
    DASHBOARD_SUMMARY: "/dashboard/summary",
} as const;
