import { apiClient } from "./apiClient";

export interface ReportsSummaryData {
    census: {
        totalResidents: number;
        activeResidents: number;
        pendingResidents: number;
        dischargedResidents: number;
        totalBeds: number;
        availableBeds: number;
        occupancyRate: number;
        careLevels: Record<string, number>;
    };
    carePlans: {
        total: number;
        signed: number;
        approved: number;
        pendingReview: number;
        draft: number;
    };
    incidents: {
        total: number;
        open: number;
        resolved: number;
        chartLockedCount: number;
        bySeverity: Record<string, number>;
        byType: Record<string, number>;
    };
    medications: {
        totalOrders: number;
        totalLogs: number;
        dosesGiven: number;
        dosesMissed: number;
        dosesRefused: number;
        adherenceRate: number;
    };
}

export interface CensusReportData {
    demographics: {
        gender: {
            male: number;
            female: number;
            other: number;
            malePercentage: number;
            femalePercentage: number;
        };
        ageBrackets: {
            under65: number;
            age65to74: number;
            age75to84: number;
            age85plus: number;
        };
    };
    residents: {
        id: string;
        code: string;
        name: string;
        dateOfBirth: string;
        age: number;
        gender: string;
        room: string;
        careLevel: string;
        status: string;
        isChartLocked: boolean;
        admissionDate: string;
    }[];
}

export interface IncidentReportItem {
    id: string;
    type: string;
    status: string;
    severity: string;
    description: string;
    reportedAt: string;
    slaDeadline: string;
    isOverdue: boolean;
    resident: {
        id: string;
        name: string;
        room: string;
        isChartLocked: boolean;
    };
    reportedBy: string;
}

export interface MedicationAdherenceItem {
    id: string;
    drugName: string;
    dosage: string;
    route: string;
    status: string;
    overrideReason?: string;
    loggedAt: string;
    residentName: string;
    room: string;
    administeredBy: string;
}

export const reportsService = {
    async getSummary(): Promise<ReportsSummaryData> {
        const { data } = await apiClient.get("/reports/summary");
        return data;
    },

    async getCensus(): Promise<CensusReportData> {
        const { data } = await apiClient.get("/reports/census");
        return data;
    },

    async getIncidents(): Promise<IncidentReportItem[]> {
        const { data } = await apiClient.get("/reports/incidents");
        return data;
    },

    async getMedications(): Promise<MedicationAdherenceItem[]> {
        const { data } = await apiClient.get("/reports/medications");
        return data;
    },
};
