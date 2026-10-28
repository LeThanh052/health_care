import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateResidentDto } from "./dto/create-resident.dto.js";
import { ListResidentsQueryDto } from "./dto/list-residents-query.dto.js";
import { UpdateResidentStatusDto } from "./dto/update-resident-status.dto.js";
import { UpdateResidentDto } from "./dto/update-resident.dto.js";

const RESIDENT_INCLUDE = {
    beds: { include: { rooms: true } },
    addresses: true,
    resident_contacts: {
        include: { contacts: true },
        take: 5,
    },
    resident_care_level_history: {
        include: { care_levels: true },
        orderBy: { start_date: "desc" as const },
        take: 1,
    },
    assessments: {
        include: {
            care_levels_assessments_confirmed_care_level_idTocare_levels: true,
            care_levels_assessments_suggested_care_level_idTocare_levels: true,
        },
        orderBy: { created_at: "desc" as const },
        take: 1,
    },
    clinical_records: {
        where: { is_deleted: false },
        orderBy: { created_at: "desc" as const },
        take: 10,
    },
};

@Injectable()
export class ResidentsService {
    constructor(private readonly prisma: PrismaService) {}

    private serializeResident(resident: any) {
        const fullName = [resident.first_name, resident.middle_name, resident.last_name].filter(Boolean).join(" ");
        const roomNumber = resident.beds?.rooms?.room_number ?? undefined;

        // Parse clinical records for medical summary & intake details
        let clinicalData: any = {};
        if (resident.clinical_records && Array.isArray(resident.clinical_records)) {
            for (let i = resident.clinical_records.length - 1; i >= 0; i--) {
                const record = resident.clinical_records[i];
                try {
                    const parsed = typeof record.description === "string" ? JSON.parse(record.description) : record.description;
                    if (parsed && typeof parsed === "object") {
                        clinicalData = { ...clinicalData, ...parsed };
                    }
                } catch {
                    // Ignore non-json records
                }
            }
        }

        const medical = clinicalData.medicalSummary || {};
        const admission = clinicalData.admissionInfo || {};
        const initialEval = clinicalData.initialEvaluation || {};
        const contactObj = clinicalData.contact || clinicalData.emergencyContact || {};

        // Find emergency contact or primary contact
        const emergencyRc =
            resident.resident_contacts?.find((rc: any) => rc.is_emergency_contact) ||
            resident.resident_contacts?.find((rc: any) => rc.is_primary) ||
            resident.resident_contacts?.[0];
        const contact = emergencyRc?.contacts;

        // Extract care level
        let rawCareLevel =
            resident.resident_care_level_history?.[0]?.care_levels?.level_code ||
            resident.assessments?.[0]?.care_levels_assessments_confirmed_care_level_idTocare_levels?.level_code ||
            admission.careLevel ||
            "assisted_living";

        let careLevel = String(rawCareLevel).toLowerCase();
        if (!["independent", "assisted_living", "memory_care", "skilled_nursing"].includes(careLevel)) {
            if (careLevel.includes("memory")) careLevel = "memory_care";
            else if (careLevel.includes("skilled")) careLevel = "skilled_nursing";
            else if (careLevel.includes("independent")) careLevel = "independent";
            else careLevel = "assisted_living";
        }

        const emergencyContactName =
            (contact ? [contact.first_name, contact.middle_name, contact.last_name].filter(Boolean).join(" ") : null) ||
            contactObj.name ||
            "Not provided";

        const emergencyContactPhone = contact?.phone_primary || contactObj.phone || "Not provided";
        const emergencyContactEmail = contact?.email || contactObj.email || undefined;
        const emergencyContactRelationship = emergencyRc?.relationship_type || contactObj.relationship || undefined;

        const phone = clinicalData.personalInfo?.phone || clinicalData.phone || undefined;
        const address = resident.addresses?.street_line1 || clinicalData.personalInfo?.address || clinicalData.address || undefined;

        const assignedNurse = admission.assignedNurse || clinicalData.assignedNurse || undefined;
        const assignedDoctor = admission.assignedDoctor || clinicalData.assignedDoctor || undefined;
        const admissionDate = admission.admissionDate || (resident.created_at ? resident.created_at.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));

        return {
            id: resident.id,
            residentCode: `NH-${String(resident.id).slice(0, 8).toUpperCase()}`,
            fullName,
            dateOfBirth: resident.date_of_birth ? resident.date_of_birth.toISOString().slice(0, 10) : "",
            gender: String(resident.gender ?? "other").toLowerCase(),
            phone,
            address,
            admissionDate,
            roomNumber: roomNumber || admission.roomNumber || undefined,
            careLevel,
            status: this.toApiStatus(resident.status),
            assignedNurse,
            assignedDoctor,
            emergencyContactName,
            emergencyContactRelationship,
            emergencyContactPhone,
            emergencyContactEmail,
            primaryDiagnosis: medical.primaryDiagnosis || clinicalData.primaryDiagnosis || undefined,
            allergies: medical.allergies || clinicalData.allergies || undefined,
            currentMedications: medical.currentMedications || clinicalData.currentMedications || undefined,
            mobilityStatus: medical.mobilityStatus || clinicalData.mobilityStatus || undefined,
            cognitiveStatus: initialEval.cognitiveStatus || clinicalData.cognitiveStatus || undefined,
            fallRisk: initialEval.fallRisk || clinicalData.fallRisk || undefined,
            painLevel: initialEval.painLevel !== undefined ? initialEval.painLevel : clinicalData.painLevel,
            nutritionNotes: initialEval.nutritionNotes || clinicalData.nutritionNotes || undefined,
            clinicalNotes: initialEval.clinicalNotes || clinicalData.clinicalNotes || undefined,
            isChartLocked: resident.is_chart_locked,
        };
    }

    private toDate(value: string) {
        return new Date(`${value}T00:00:00.000Z`);
    }

    private splitFullName(fullName: string) {
        const parts = fullName.trim().split(/\s+/);
        const firstName = parts.shift() ?? fullName.trim();
        const lastName = parts.pop() ?? firstName;
        const middleName = parts.length ? parts.join(" ") : null;

        return {
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
        };
    }

    private toApiStatus(status: string) {
        const normalized = status.toUpperCase();

        if (normalized === "ACTIVE") {
            return "admitted";
        }

        if (normalized === "DISCHARGED") {
            return "discharged";
        }

        return "pending";
    }

    private toDbStatus(status?: string) {
        if (status === "admitted") {
            return "ACTIVE";
        }

        if (status === "discharged") {
            return "DISCHARGED";
        }

        return "PENDING";
    }

    async checkChartLock(id: string) {
        const res = await this.prisma.residents.findUnique({
            where: { id },
            select: { is_chart_locked: true },
        });
        if (res?.is_chart_locked) {
            throw new ForbiddenException("Resident chart is locked. Modifications are not allowed.");
        }
    }

    async findAll(query: ListResidentsQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const search = query.search?.trim();

        const where: Prisma.residentsWhereInput = {
            ...(query.status && query.status !== "all" ? { status: this.toDbStatus(query.status) } : {}),
            ...(search
                ? {
                      OR: [{ first_name: { contains: search } }, { middle_name: { contains: search } }, { last_name: { contains: search } }],
                  }
                : {}),
        };

        const [residents, total] = await Promise.all([
            this.prisma.residents.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                include: RESIDENT_INCLUDE,
            }),
            this.prisma.residents.count({ where }),
        ]);

        return {
            data: residents.map((resident) => this.serializeResident(resident)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const resident = await this.prisma.residents.findUnique({
            where: { id },
            include: RESIDENT_INCLUDE,
        });

        if (!resident) {
            throw new NotFoundException(`Resident with ID ${id} not found`);
        }

        return this.serializeResident(resident);
    }

    async create(dto: CreateResidentDto) {
        let bedId: string | undefined = undefined;
        if (dto.roomNumber) {
            const room = await this.prisma.rooms.findFirst({
                where: { room_number: dto.roomNumber },
                include: { beds: true },
            });
            if (room && room.beds.length > 0) {
                bedId = room.beds[0].id;
            }
        }

        let addressId: bigint | undefined = undefined;
        if (dto.address) {
            const newAddr = await this.prisma.addresses.create({
                data: {
                    street_line1: dto.address,
                    city: "Local",
                    state: "NA",
                    zip_code: "00000",
                },
            });
            addressId = newAddr.id;
        }

        const resident = await this.prisma.residents.create({
            data: {
                ...this.splitFullName(dto.fullName),
                date_of_birth: this.toDate(dto.dateOfBirth),
                gender: dto.gender.toUpperCase(),
                status: "PENDING",
                bed_id: bedId,
                address_id: addressId,
            },
        });

        // Emergency Contact
        if (dto.emergencyContactName && dto.emergencyContactPhone) {
            const contactName = this.splitFullName(dto.emergencyContactName);
            const contact = await this.prisma.contacts.create({
                data: {
                    ...contactName,
                    phone_primary: dto.emergencyContactPhone,
                    email: dto.emergencyContactEmail,
                },
            });
            await this.prisma.resident_contacts.create({
                data: {
                    resident_id: resident.id,
                    contact_id: contact.id,
                    relationship_type: dto.emergencyContactRelationship || "Emergency Contact",
                    is_emergency_contact: true,
                    is_primary: true,
                },
            });
        }

        // Care level history
        if (dto.careLevel) {
            const levelCode = dto.careLevel.toUpperCase();
            const careLevel = await this.prisma.care_levels.findFirst({
                where: {
                    OR: [
                        { level_code: levelCode },
                        { level_code: levelCode.replace("_", "") },
                    ],
                },
            });
            if (careLevel) {
                await this.prisma.resident_care_level_history.create({
                    data: {
                        resident_id: resident.id,
                        care_level_id: careLevel.id,
                        start_date: new Date(),
                    },
                });
            }
        }

        // Clinical record
        const staffUser = await this.prisma.user.findFirst({ select: { id: true } });
        if (staffUser) {
            await this.prisma.clinical_records.create({
                data: {
                    resident_id: resident.id,
                    recorded_by: staffUser.id,
                    record_type: "PROGRESS_NOTE",
                    description: JSON.stringify({
                        type: "RESIDENT_PROFILE",
                        phone: dto.phone,
                        address: dto.address,
                        admissionInfo: {
                            admissionDate: dto.admissionDate,
                            roomNumber: dto.roomNumber,
                            careLevel: dto.careLevel,
                            assignedNurse: dto.assignedNurse,
                            assignedDoctor: dto.assignedDoctor,
                        },
                        medicalSummary: {
                            primaryDiagnosis: dto.primaryDiagnosis,
                            allergies: dto.allergies,
                            currentMedications: dto.currentMedications,
                            mobilityStatus: dto.mobilityStatus,
                        },
                        contact: {
                            name: dto.emergencyContactName,
                            relationship: dto.emergencyContactRelationship,
                            phone: dto.emergencyContactPhone,
                            email: dto.emergencyContactEmail,
                        },
                    }),
                },
            });
        }

        return this.findOne(resident.id);
    }

    async update(id: string, dto: UpdateResidentDto) {
        await this.findOne(id);
        await this.checkChartLock(id);

        const data: Prisma.residentsUpdateInput = {
            ...(dto.fullName !== undefined ? this.splitFullName(dto.fullName) : {}),
            ...(dto.dateOfBirth !== undefined ? { date_of_birth: this.toDate(dto.dateOfBirth) } : {}),
            ...(dto.gender !== undefined ? { gender: dto.gender.toUpperCase() } : {}),
        };

        // 1. Room / Bed association
        if (dto.roomNumber) {
            const room = await this.prisma.rooms.findFirst({
                where: { room_number: dto.roomNumber },
                include: { beds: true },
            });
            if (room) {
                let bed = room.beds[0];
                if (!bed) {
                    bed = await this.prisma.beds.create({
                        data: {
                            room_id: room.id,
                            bed_number: "1",
                            status: "OCCUPIED",
                        },
                    });
                }
                data.beds = { connect: { id: bed.id } };
            }
        }

        // 2. Address
        if (dto.address) {
            const currentResident = await this.prisma.residents.findUnique({
                where: { id },
                select: { address_id: true },
            });
            if (currentResident?.address_id) {
                await this.prisma.addresses.update({
                    where: { id: currentResident.address_id },
                    data: {
                        street_line1: dto.address,
                        city: "Local",
                        state: "NA",
                        zip_code: "00000",
                    },
                });
            } else {
                const newAddr = await this.prisma.addresses.create({
                    data: {
                        street_line1: dto.address,
                        city: "Local",
                        state: "NA",
                        zip_code: "00000",
                    },
                });
                data.addresses = { connect: { id: newAddr.id } };
            }
        }

        await this.prisma.residents.update({
            where: { id },
            data,
        });

        // 3. Emergency Contact
        if (dto.emergencyContactName || dto.emergencyContactPhone) {
            const existingRc = await this.prisma.resident_contacts.findFirst({
                where: { resident_id: id },
                include: { contacts: true },
            });
            const contactName = this.splitFullName(dto.emergencyContactName || "Emergency Contact");
            if (existingRc) {
                await this.prisma.contacts.update({
                    where: { id: existingRc.contact_id },
                    data: {
                        ...contactName,
                        phone_primary: dto.emergencyContactPhone || existingRc.contacts.phone_primary,
                        email: dto.emergencyContactEmail ?? existingRc.contacts.email,
                    },
                });
                if (dto.emergencyContactRelationship) {
                    await this.prisma.resident_contacts.update({
                        where: { id: existingRc.id },
                        data: { relationship_type: dto.emergencyContactRelationship },
                    });
                }
            } else if (dto.emergencyContactName && dto.emergencyContactPhone) {
                const newContact = await this.prisma.contacts.create({
                    data: {
                        ...contactName,
                        phone_primary: dto.emergencyContactPhone,
                        email: dto.emergencyContactEmail,
                    },
                });
                await this.prisma.resident_contacts.create({
                    data: {
                        resident_id: id,
                        contact_id: newContact.id,
                        relationship_type: dto.emergencyContactRelationship || "Emergency Contact",
                        is_emergency_contact: true,
                        is_primary: true,
                    },
                });
            }
        }

        // 4. Care Level
        if (dto.careLevel) {
            const levelCode = dto.careLevel.toUpperCase();
            const careLevel = await this.prisma.care_levels.findFirst({
                where: {
                    OR: [
                        { level_code: levelCode },
                        { level_code: levelCode.replace("_", "") },
                        { level_code: `LEVEL_${levelCode}` },
                    ],
                },
            });
            if (careLevel) {
                await this.prisma.resident_care_level_history.create({
                    data: {
                        resident_id: id,
                        care_level_id: careLevel.id,
                        start_date: new Date(),
                    },
                });
            }
        }

        // 5. Clinical Record
        const staffUser = await this.prisma.user.findFirst({ select: { id: true } });
        if (staffUser) {
            await this.prisma.clinical_records.create({
                data: {
                    resident_id: id,
                    recorded_by: staffUser.id,
                    record_type: "PROGRESS_NOTE",
                    description: JSON.stringify({
                        type: "RESIDENT_PROFILE",
                        phone: dto.phone,
                        address: dto.address,
                        admissionInfo: {
                            admissionDate: dto.admissionDate,
                            roomNumber: dto.roomNumber,
                            careLevel: dto.careLevel,
                            assignedNurse: dto.assignedNurse,
                            assignedDoctor: dto.assignedDoctor,
                        },
                        medicalSummary: {
                            primaryDiagnosis: dto.primaryDiagnosis,
                            allergies: dto.allergies,
                            currentMedications: dto.currentMedications,
                            mobilityStatus: dto.mobilityStatus,
                        },
                        contact: {
                            name: dto.emergencyContactName,
                            relationship: dto.emergencyContactRelationship,
                            phone: dto.emergencyContactPhone,
                            email: dto.emergencyContactEmail,
                        },
                    }),
                },
            });
        }

        return this.findOne(id);
    }

    async updateStatus(id: string, dto: UpdateResidentStatusDto) {
        await this.findOne(id);
        await this.checkChartLock(id);

        await this.prisma.residents.update({
            where: { id },
            data: { status: this.toDbStatus(dto.status) },
        });

        return this.findOne(id);
    }
}
