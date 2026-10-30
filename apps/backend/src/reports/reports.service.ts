import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) {}

    private calculateAge(dob?: Date | null): number {
        if (!dob) return 75;
        const diffMs = Date.now() - new Date(dob).getTime();
        const ageDt = new Date(diffMs);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    }

    async getSummary() {
        const [
            totalResidents,
            activeResidents,
            pendingResidents,
            dischargedResidents,
            totalBeds,
            totalCarePlans,
            carePlansByStatus,
            totalIncidents,
            incidentsByStatus,
            incidentsBySeverity,
            incidentsByType,
            chartLockedCount,
            totalMedOrders,
            totalMedLogs,
            medLogsByStatus,
            locHistories,
        ] = await Promise.all([
            this.prisma.residents.count({ where: { is_deleted: false } }),
            this.prisma.residents.count({ where: { is_deleted: false, status: "ACTIVE" } }),
            this.prisma.residents.count({ where: { is_deleted: false, status: "PENDING" } }),
            this.prisma.residents.count({ where: { is_deleted: false, status: "DISCHARGED" } }),
            this.prisma.beds.count(),
            this.prisma.care_plans.count({ where: { is_deleted: false } }),
            this.prisma.care_plans.groupBy({
                by: ["status"],
                where: { is_deleted: false },
                _count: { id: true },
            }),
            this.prisma.incidents.count(),
            this.prisma.incidents.groupBy({
                by: ["status"],
                _count: { id: true },
            }),
            this.prisma.incidents.findMany({
                select: { incident_severities: { select: { level_name: true } } },
            }),
            this.prisma.incidents.groupBy({
                by: ["incident_type"],
                _count: { id: true },
            }),
            this.prisma.residents.count({ where: { is_deleted: false, is_chart_locked: true } }),
            this.prisma.medication_orders.count({ where: { is_deleted: false, status: "ACTIVE" } }),
            this.prisma.medication_logs.count(),
            this.prisma.medication_logs.groupBy({
                by: ["status"],
                _count: { id: true },
            }),
            this.prisma.resident_care_level_history.findMany({
                where: { end_date: null },
                include: { care_levels: true },
            }),
        ]);

        // Occupancy calculation
        const occupancyRate = totalBeds > 0 ? Number(((activeResidents / totalBeds) * 100).toFixed(1)) : 0;

        // Care level distribution
        const locMap: Record<string, number> = {
            "Tier 1 - Low": 0,
            "Tier 2 - Moderate": 0,
            "Tier 3 - High": 0,
            "Tier 4 - Total": 0,
        };
        for (const h of locHistories) {
            const name = h.care_levels?.level_name ?? "Tier 2 - Moderate";
            locMap[name] = (locMap[name] || 0) + 1;
        }

        // Care plan status mapping
        const carePlanStats = {
            total: totalCarePlans,
            signed: 0,
            approved: 0,
            pendingReview: 0,
            draft: 0,
        };
        for (const item of carePlansByStatus) {
            const s = item.status.toUpperCase();
            if (s === "SIGNED") carePlanStats.signed += item._count.id;
            else if (s === "APPROVED") carePlanStats.approved += item._count.id;
            else if (s.includes("PENDING")) carePlanStats.pendingReview += item._count.id;
            else if (s === "DRAFT") carePlanStats.draft += item._count.id;
        }

        // Incident severity count
        const severityMap: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
        for (const inc of incidentsBySeverity) {
            const lvl = inc.incident_severities?.level_name?.toUpperCase() || "LOW";
            severityMap[lvl] = (severityMap[lvl] || 0) + 1;
        }

        // Incident type count
        const typeMap: Record<string, number> = {};
        for (const t of incidentsByType) {
            typeMap[t.incident_type] = t._count.id;
        }

        // Medication adherence
        let dosesGiven = 0;
        let dosesMissed = 0;
        let dosesRefused = 0;
        for (const m of medLogsByStatus) {
            const st = m.status.toUpperCase();
            if (st === "GIVEN") dosesGiven += m._count.id;
            else if (st === "MISSED") dosesMissed += m._count.id;
            else if (st === "REFUSED") dosesRefused += m._count.id;
        }
        const totalEvaluatedDoses = dosesGiven + dosesMissed + dosesRefused;
        const adherenceRate = totalEvaluatedDoses > 0 ? Number(((dosesGiven / totalEvaluatedDoses) * 100).toFixed(1)) : 95.0;

        return {
            census: {
                totalResidents,
                activeResidents,
                pendingResidents,
                dischargedResidents,
                totalBeds,
                availableBeds: Math.max(0, totalBeds - activeResidents),
                occupancyRate,
                careLevels: locMap,
            },
            carePlans: carePlanStats,
            incidents: {
                total: totalIncidents,
                open: incidentsByStatus
                    .filter((s) => s.status !== "CLOSED" && s.status !== "RESOLVED")
                    .reduce((sum, s) => sum + s._count.id, 0),
                resolved: incidentsByStatus
                    .filter((s) => s.status === "CLOSED" || s.status === "RESOLVED")
                    .reduce((sum, s) => sum + s._count.id, 0),
                chartLockedCount,
                bySeverity: severityMap,
                byType: typeMap,
            },
            medications: {
                totalOrders: totalMedOrders,
                totalLogs: totalMedLogs,
                dosesGiven,
                dosesMissed,
                dosesRefused,
                adherenceRate,
            },
        };
    }

    async getCensus() {
        const residents = await this.prisma.residents.findMany({
            where: { is_deleted: false },
            include: {
                beds: { include: { rooms: true } },
                resident_care_level_history: {
                    where: { end_date: null },
                    include: { care_levels: true },
                    take: 1,
                },
            },
            orderBy: [{ status: "asc" }, { last_name: "asc" }],
        });

        let maleCount = 0;
        let femaleCount = 0;
        let otherCount = 0;

        const ageBrackets = {
            under65: 0,
            age65to74: 0,
            age75to84: 0,
            age85plus: 0,
        };

        const list = residents.map((r) => {
            const age = this.calculateAge(r.date_of_birth);
            const gender = (r.gender || "Other").toLowerCase();

            if (gender === "male") maleCount++;
            else if (gender === "female") femaleCount++;
            else otherCount++;

            if (age < 65) ageBrackets.under65++;
            else if (age < 75) ageBrackets.age65to74++;
            else if (age < 85) ageBrackets.age75to84++;
            else ageBrackets.age85plus++;

            const roomNumber = r.beds?.rooms?.room_number ?? "Unassigned";
            const bedNumber = r.beds?.bed_number ?? "";
            const roomDisplay = bedNumber ? `${roomNumber}-${bedNumber}` : roomNumber;

            return {
                id: r.id,
                code: `NH-${String(r.id).slice(0, 8).toUpperCase()}`,
                name: `${r.first_name} ${r.last_name}`,
                dateOfBirth: r.date_of_birth ? r.date_of_birth.toISOString().slice(0, 10) : "",
                age,
                gender: r.gender || "Other",
                room: roomDisplay,
                careLevel: r.resident_care_level_history?.[0]?.care_levels?.level_name ?? "Tier 2 - Moderate",
                status: r.status,
                isChartLocked: r.is_chart_locked,
                admissionDate: r.created_at ? r.created_at.toISOString().slice(0, 10) : "",
            };
        });

        const total = residents.length || 1;
        return {
            demographics: {
                gender: {
                    male: maleCount,
                    female: femaleCount,
                    other: otherCount,
                    malePercentage: Number(((maleCount / total) * 100).toFixed(1)),
                    femalePercentage: Number(((femaleCount / total) * 100).toFixed(1)),
                },
                ageBrackets,
            },
            residents: list,
        };
    }

    async getIncidents() {
        const incidents = await this.prisma.incidents.findMany({
            include: {
                residents: {
                    include: { beds: { include: { rooms: true } } },
                },
                incident_severities: true,
                users: true,
            },
            orderBy: { reported_at: "desc" },
        });

        return incidents.map((inc) => {
            const roomNumber = inc.residents?.beds?.rooms?.room_number ?? "Unassigned";
            const bedNumber = inc.residents?.beds?.bed_number ?? "";
            const roomDisplay = bedNumber ? `${roomNumber}-${bedNumber}` : roomNumber;

            const isOverdue = inc.status !== "CLOSED" && inc.status !== "RESOLVED" && new Date(inc.sla_deadline) < new Date();

            return {
                id: inc.id,
                type: inc.incident_type,
                status: inc.status,
                severity: inc.incident_severities?.level_name || "LOW",
                description: inc.description,
                reportedAt: inc.reported_at.toISOString(),
                slaDeadline: inc.sla_deadline.toISOString(),
                isOverdue,
                resident: {
                    id: inc.residents?.id,
                    name: inc.residents ? `${inc.residents.first_name} ${inc.residents.last_name}` : "Unknown Resident",
                    room: roomDisplay,
                    isChartLocked: inc.residents?.is_chart_locked,
                },
                reportedBy: inc.users ? `${inc.users.firstName} ${inc.users.lastName}` : "Staff Nurse",
            };
        });
    }

    async getMedicationAdherence() {
        const logs = await this.prisma.medication_logs.findMany({
            include: {
                medication_orders: {
                    include: {
                        residents: {
                            include: { beds: { include: { rooms: true } } },
                        },
                    },
                },
                users_medication_logs_administered_byTousers: {
                    select: { firstName: true, lastName: true },
                },
            },
            orderBy: { logged_at: "desc" },
            take: 30,
        });

        return logs.map((log) => {
            const order = log.medication_orders;
            const res = order?.residents;
            const room = res?.beds?.rooms?.room_number ?? "Unassigned";

            return {
                id: String(log.id),
                drugName: order?.drug_name ?? "Medication",
                dosage: order?.dosage ?? "",
                route: order?.route ?? "",
                status: log.status,
                overrideReason: log.override_reason,
                loggedAt: log.logged_at.toISOString(),
                residentName: res ? `${res.first_name} ${res.last_name}` : "Unknown",
                room,
                administeredBy: log.users_medication_logs_administered_byTousers
                    ? `${log.users_medication_logs_administered_byTousers.firstName} ${log.users_medication_logs_administered_byTousers.lastName}`
                    : "Staff",
            };
        });
    }
}
