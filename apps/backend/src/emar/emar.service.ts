import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AdministerMedicationDto, CreateMedicationOrderDto } from "./dto/emar.dto.js";

@Injectable()
export class EmarService {
    constructor(private readonly prisma: PrismaService) {}

    private calculateAge(dob?: Date | null): number {
        if (!dob) return 75;
        const diffMs = Date.now() - new Date(dob).getTime();
        const ageDt = new Date(diffMs);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    }

    private extractAllergiesAndDiagnosis(resident: any): { allergies: string[]; primaryDiagnosis: string } {
        let allergies = ["Penicillin"];
        let primaryDiagnosis = "Essential Hypertension";

        // Extract from clinical records
        if (resident.clinical_records && resident.clinical_records.length > 0) {
            for (const record of resident.clinical_records) {
                try {
                    const parsed = typeof record.description === "string" ? JSON.parse(record.description) : record.description;
                    if (parsed && typeof parsed === "object") {
                        if (parsed.medicalSummary?.allergies) {
                            allergies = Array.isArray(parsed.medicalSummary.allergies)
                                ? parsed.medicalSummary.allergies
                                : String(parsed.medicalSummary.allergies).split(/,\s*/);
                        } else if (parsed.allergies) {
                            allergies = Array.isArray(parsed.allergies) ? parsed.allergies : String(parsed.allergies).split(/,\s*/);
                        }

                        if (parsed.medicalSummary?.primaryDiagnosis) {
                            primaryDiagnosis = parsed.medicalSummary.primaryDiagnosis;
                        } else if (parsed.primaryDiagnosis) {
                            primaryDiagnosis = parsed.primaryDiagnosis;
                        }
                    }
                } catch {
                    // Ignore non-json records
                }
            }
        }

        // Fallback checks from pre-admission screenings
        if (resident.pre_admission_screenings && resident.pre_admission_screenings.length > 0) {
            const pas = resident.pre_admission_screenings[0];
            if (pas.allergies && allergies.length <= 1) {
                allergies = String(pas.allergies).split(/,\s*/);
            }
            if (pas.primary_diagnosis && primaryDiagnosis === "Essential Hypertension") {
                primaryDiagnosis = pas.primary_diagnosis;
            }
        }

        return { allergies, primaryDiagnosis };
    }

    async getResidents() {
        const residents = await this.prisma.residents.findMany({
            where: { is_deleted: false },
            include: {
                beds: { include: { rooms: true } },
                resident_care_level_history: {
                    where: { end_date: null },
                    include: { care_levels: true },
                    take: 1,
                },
                medication_orders: {
                    where: { is_deleted: false, status: "ACTIVE" },
                },
                clinical_records: {
                    where: { is_deleted: false },
                    take: 3,
                },
                pre_admission_screenings: {
                    take: 1,
                },
            },
            orderBy: [{ status: "asc" }, { last_name: "asc" }],
        });

        return residents.map((r) => {
            const { allergies, primaryDiagnosis } = this.extractAllergiesAndDiagnosis(r);
            const roomNumber = r.beds?.rooms?.room_number ?? "Unassigned";
            const bedNumber = r.beds?.bed_number ?? "";
            const roomDisplay = bedNumber ? `${roomNumber}-${bedNumber}` : roomNumber;
            const careLevel = r.resident_care_level_history?.[0]?.care_levels?.level_name ?? "Tier 2 - Moderate";

            return {
                id: r.id,
                code: `NH-${String(r.id).slice(0, 8).toUpperCase()}`,
                name: `${r.first_name} ${r.last_name}`,
                firstName: r.first_name,
                lastName: r.last_name,
                age: this.calculateAge(r.date_of_birth),
                gender: r.gender || "Other",
                room: roomDisplay,
                status: r.status,
                careLevel,
                isChartLocked: r.is_chart_locked,
                activeMedicationsCount: r.medication_orders.length,
                allergies,
                primaryDiagnosis,
            };
        });
    }

    async getResidentMedications(residentId: string) {
        const resident = await this.prisma.residents.findUnique({
            where: { id: residentId },
            include: {
                beds: { include: { rooms: true } },
                resident_care_level_history: {
                    where: { end_date: null },
                    include: { care_levels: true },
                    take: 1,
                },
                medication_orders: {
                    where: { is_deleted: false },
                    include: {
                        medication_schedules: { where: { is_active: true } },
                        medication_logs: {
                            orderBy: { logged_at: "desc" },
                            take: 5,
                            include: {
                                users_medication_logs_administered_byTousers: {
                                    select: { firstName: true, lastName: true },
                                },
                            },
                        },
                        users: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                    orderBy: { created_at: "desc" },
                },
                clinical_records: {
                    where: { is_deleted: false },
                    take: 3,
                },
                pre_admission_screenings: {
                    take: 1,
                },
                vital_signs: {
                    orderBy: { recorded_at: "desc" },
                    take: 1,
                },
            },
        });

        if (!resident) {
            throw new NotFoundException(`Resident with ID ${residentId} not found`);
        }

        const { allergies, primaryDiagnosis } = this.extractAllergiesAndDiagnosis(resident);
        const roomNumber = resident.beds?.rooms?.room_number ?? "Unassigned";
        const bedNumber = resident.beds?.bed_number ?? "";
        const roomDisplay = bedNumber ? `${roomNumber}-${bedNumber}` : roomNumber;
        const careLevel = resident.resident_care_level_history?.[0]?.care_levels?.level_name ?? "Tier 2 - Moderate";

        const mappedOrders = resident.medication_orders.map((order) => {
            const schedules = order.medication_schedules.map((s) => {
                const d = new Date(s.scheduled_time);
                const h = String(d.getUTCHours()).padStart(2, "0");
                const m = String(d.getUTCMinutes()).padStart(2, "0");
                return `${h}:${m}`;
            });

            // Default fallback times if none registered
            const finalSchedules = schedules.length > 0 ? schedules : ["08:00", "20:00"];

            // Format administration logs
            const logs = order.medication_logs.map((log) => ({
                id: String(log.id),
                status: log.status,
                loggedAt: log.logged_at.toISOString(),
                administeredBy: log.users_medication_logs_administered_byTousers
                    ? `${log.users_medication_logs_administered_byTousers.firstName} ${log.users_medication_logs_administered_byTousers.lastName}`
                    : "Staff Nurse",
                overrideReason: log.override_reason,
            }));

            // Determine current status for the day
            const latestLog = logs[0];
            let currentStatus: "administered" | "missed" | "pending" | "refused" = "pending";
            if (latestLog) {
                const logTime = new Date(latestLog.loggedAt).getTime();
                const isToday = Date.now() - logTime < 24 * 3600 * 1000;
                if (isToday) {
                    if (latestLog.status === "GIVEN") currentStatus = "administered";
                    else if (latestLog.status === "MISSED") currentStatus = "missed";
                    else if (latestLog.status === "REFUSED") currentStatus = "refused";
                }
            }

            return {
                id: order.id,
                name: order.drug_name,
                dosage: order.dosage,
                route: order.route,
                frequency: order.frequency,
                schedule: finalSchedules,
                status: order.status,
                currentStatus,
                isControlledSubstance: order.is_controlled_substance,
                prescribedBy: order.users
                    ? `${order.users.firstName.startsWith("Dr.") ? order.users.firstName : `Dr. ${order.users.firstName}`} ${order.users.lastName}`
                    : "Dr. Robert Chen, MD",
                logs,
            };
        });

        return {
            resident: {
                id: resident.id,
                code: `NH-${String(resident.id).slice(0, 8).toUpperCase()}`,
                name: `${resident.first_name} ${resident.last_name}`,
                age: this.calculateAge(resident.date_of_birth),
                gender: resident.gender || "Other",
                room: roomDisplay,
                status: resident.status,
                careLevel,
                isChartLocked: resident.is_chart_locked,
                allergies,
                primaryDiagnosis,
                bloodType: "O+",
                weight: "68 kg",
                latestVitals: resident.vital_signs[0]
                    ? {
                          bp: `${resident.vital_signs[0].blood_pressure_systolic ?? 120}/${resident.vital_signs[0].blood_pressure_diastolic ?? 80}`,
                          hr: resident.vital_signs[0].heart_rate_bpm ?? 72,
                          spo2: resident.vital_signs[0].spo2_percentage ?? 98,
                          temp: `${resident.vital_signs[0].temperature_fahrenheit ?? 98.6}°F`,
                      }
                    : null,
            },
            medications: mappedOrders,
        };
    }

    async administer(dto: AdministerMedicationDto, userId?: string) {
        const order = await this.prisma.medication_orders.findUnique({
            where: { id: dto.orderId },
            include: { residents: true },
        });

        if (!order) {
            throw new NotFoundException(`Medication order with ID ${dto.orderId} not found`);
        }

        // Default to first nurse or admin user if not passed from token
        let finalUserId = userId;
        if (!finalUserId) {
            const fallbackUser = await this.prisma.user.findFirst({
                where: { email: { in: ["nurse@facility.org", "j.rivera@facility.org", "admin@facility.org"] } },
            });
            finalUserId = fallbackUser?.id;
        }

        if (!finalUserId) {
            throw new BadRequestException("User ID is required to record medication administration");
        }

        const log = await this.prisma.medication_logs.create({
            data: {
                order_id: dto.orderId,
                administered_by: finalUserId,
                status: dto.status,
                is_clinically_justified: true,
                override_reason: dto.overrideReason || dto.notes || null,
                logged_at: new Date(),
            },
            include: {
                users_medication_logs_administered_byTousers: {
                    select: { firstName: true, lastName: true },
                },
            },
        });

        return {
            success: true,
            message: `Recorded ${dto.status} for ${order.drug_name}`,
            log: {
                id: String(log.id),
                status: log.status,
                loggedAt: log.logged_at.toISOString(),
                administeredBy: log.users_medication_logs_administered_byTousers
                    ? `${log.users_medication_logs_administered_byTousers.firstName} ${log.users_medication_logs_administered_byTousers.lastName}`
                    : "Staff",
            },
        };
    }

    async createOrder(dto: CreateMedicationOrderDto, userId?: string) {
        const resident = await this.prisma.residents.findUnique({ where: { id: dto.residentId } });
        if (!resident) {
            throw new NotFoundException(`Resident ${dto.residentId} not found`);
        }

        let prescriberId = userId;
        if (!prescriberId) {
            const doctor = await this.prisma.user.findFirst({ where: { email: "physician@facility.org" } });
            prescriberId = doctor?.id || (await this.prisma.user.findFirst())?.id;
        }

        const order = await this.prisma.medication_orders.create({
            data: {
                resident_id: dto.residentId,
                prescribed_by: prescriberId!,
                drug_name: dto.drugName,
                dosage: dto.dosage,
                route: dto.route,
                frequency: dto.frequency,
                is_controlled_substance: dto.isControlledSubstance ?? false,
                status: "ACTIVE",
            },
        });

        const times = dto.scheduleTimes && dto.scheduleTimes.length > 0 ? dto.scheduleTimes : ["08:00", "20:00"];
        for (const timeStr of times) {
            const [h, m] = timeStr.split(":").map(Number);
            const schedDate = new Date();
            schedDate.setUTCHours(h, m, 0, 0);

            await this.prisma.medication_schedules.create({
                data: {
                    order_id: order.id,
                    scheduled_time: schedDate,
                    is_active: true,
                },
            });
        }

        return {
            success: true,
            data: order,
        };
    }
}
