import { apiClient } from "./apiClient";

export interface EmarResidentItem {
    id: string;
    code: string;
    name: string;
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    room: string;
    status: string;
    careLevel: string;
    isChartLocked: boolean;
    activeMedicationsCount: number;
    allergies: string[];
    primaryDiagnosis: string;
}

export interface MedicationScheduleItem {
    id: string;
    name: string;
    dosage: string;
    route: string;
    frequency: string;
    schedule: string[];
    status: string;
    currentStatus: "administered" | "missed" | "pending" | "refused";
    isControlledSubstance: boolean;
    prescribedBy: string;
    logs: {
        id: string;
        status: string;
        loggedAt: string;
        administeredBy: string;
        overrideReason?: string;
    }[];
}

export interface EmarResidentProfile {
    resident: {
        id: string;
        code: string;
        name: string;
        age: number;
        gender: string;
        room: string;
        status: string;
        careLevel: string;
        isChartLocked: boolean;
        allergies: string[];
        primaryDiagnosis: string;
        bloodType: string;
        weight: string;
        latestVitals?: {
            bp: string;
            hr: number;
            spo2: number;
            temp: string;
        } | null;
    };
    medications: MedicationScheduleItem[];
}

export const emarService = {
    async getResidents(): Promise<EmarResidentItem[]> {
        const { data } = await apiClient.get("/emar/residents");
        return data;
    },

    async getResidentMedications(residentId: string): Promise<EmarResidentProfile> {
        const { data } = await apiClient.get(`/emar/residents/${residentId}`);
        return data;
    },

    async administer(payload: {
        orderId: string;
        status: "GIVEN" | "MISSED" | "REFUSED" | "HELD";
        overrideReason?: string;
        notes?: string;
    }): Promise<{ success: boolean; message: string; log: any }> {
        const { data } = await apiClient.post("/emar/administer", payload);
        return data;
    },

    async createOrder(payload: {
        residentId: string;
        drugName: string;
        dosage: string;
        route: string;
        frequency: string;
        scheduleTimes?: string[];
        isControlledSubstance?: boolean;
    }): Promise<any> {
        const { data } = await apiClient.post("/emar/orders", payload);
        return data;
    },
};
