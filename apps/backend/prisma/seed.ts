/**
 * Prisma seed script.
 * Run with:  npx prisma db seed
 * Configure in package.json:
 *   "prisma": { "seed": "ts-node prisma/seed.ts" }
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;
const DEFAULT_FACILITY_CODE = "FAC-0042";

const careLevelSeed = [
  {
    levelCode: "INDEPENDENT_LIVING",
    levelName: "Tier 1 - Low",
    dailyRate: 165,
  },
  {
    levelCode: "ASSISTED_LIVING",
    levelName: "Tier 2 - Moderate",
    dailyRate: 205,
  },
  {
    levelCode: "MEMORY_CARE",
    levelName: "Tier 3 - High",
    dailyRate: 248,
  },
  {
    levelCode: "SKILLED_NURSING",
    levelName: "Tier 4 - Total",
    dailyRate: 310,
  },
] as const;

const roomSeed = [
  { roomNumber: "101", roomType: "Private", bedNumber: "A", status: "AVAILABLE" },
  { roomNumber: "106", roomType: "Semi-private", bedNumber: "A", status: "OCCUPIED" },
  { roomNumber: "114", roomType: "Semi-private", bedNumber: "B", status: "OCCUPIED" },
  { roomNumber: "118", roomType: "Semi-private", bedNumber: "A", status: "OCCUPIED" },
  { roomNumber: "204", roomType: "Semi-private", bedNumber: "B", status: "OCCUPIED" },
  { roomNumber: "210", roomType: "Semi-private", bedNumber: "B", status: "OCCUPIED" },
  { roomNumber: "215", roomType: "Private", bedNumber: "A", status: "MAINTENANCE" },
  { roomNumber: "222", roomType: "Semi-private", bedNumber: "A", status: "OCCUPIED" },
] as const;

const roomRateSeed = [
  { roomType: "Private", dailyRate: 220, effectiveFrom: "2026-01-01" },
  { roomType: "Semi-private", dailyRate: 185, effectiveFrom: "2026-01-01" },
  { roomType: "Ward", dailyRate: 150, effectiveFrom: "2026-01-01" },
] as const;

const clinicalCapabilitySeed = [
  { capability: "Wound care / pressure ulcer management", supported: true },
  { capability: "Physical / Occupational / Speech therapy", supported: true },
  { capability: "Dementia or behavioral health management", supported: true },
  {
    capability: "Bariatric care needs",
    supported: false,
    note: "Facility-wide bed weight limit: 300 lb (no bariatric-rated equipment on site).",
  },
  { capability: "IV therapy or complex medication administration", supported: true },
  { capability: "Ventilator or respiratory support", supported: true },
  { capability: "Hospice or palliative care coordination", supported: true },
  { capability: "Isolation precautions (MRSA, C. diff, etc.)", supported: true },
] as const;

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function main() {
  const rolesData = [
    { roleName: "Admission Staff", description: "Manages resident intake: pre-admission screening, admission forms, and profile creation. Full access to M1 registration." },
    { roleName: "Nurse (RN/LPN)", description: "Performs clinical assessments, drafts and manages care plans, records bedside vitals. Cannot approve care plans (DON)." },
    { roleName: "CNA", description: "Executes daily assigned tasks and records bedside vitals for assigned residents. Mobile-first view (NFR-04)." },
    { roleName: "DON (Director of Nursing)", description: "Reviews/approves care plans, oversees incidents with SLA tracking, monitors staffing ratio + census/billing snapshot." },
    { roleName: "System Admin", description: "Configures facility settings, rates, staffing thresholds, user accounts, and equipment inventory. No clinical access." },
    { roleName: "Physician", description: "Limited-access external signer. Reviews care plans for residents under their care; e-signs M2-US-10 only." },
    { roleName: "Dietary", description: "Limited-access external signer. Reviews nutrition-related care plan sections; e-signs M2-US-10 only." }
  ];

  const dbRoles: Record<string, any> = {};
  for (const r of rolesData) {
    dbRoles[r.roleName] = await prisma.role.upsert({
      where: { roleName: r.roleName },
      update: { description: r.description },
      create: r,
    });
  }

  // ── Permissions ────────────────────────────────────────────────────────────
  const modules = [
    'ADMIN_CONFIG',
    'RESIDENT_LIST',
    'PROFILE_DETAIL',
    'INITIAL_ASSESSMENT',
    'CARE_PLAN_LIST',
    'DON_REVIEW',
    'BEDSIDE_VITALS',
    'REPORT_INCIDENT',
    'INCIDENT_LIST',
    'IDT_ACKNOWLEDGMENT'
  ];

  for (const mod of modules) {
    await prisma.permission.upsert({
      where: { actionCode: `${mod}_VIEW` },
      update: {},
      create: { actionCode: `${mod}_VIEW` }
    });
    await prisma.permission.upsert({
      where: { actionCode: `${mod}_MANAGE` },
      update: {},
      create: { actionCode: `${mod}_MANAGE` }
    });
  }

  // ── Users for all roles ───────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("Password123!", BCRYPT_ROUNDS);

  // 1. System Admin
  await prisma.user.upsert({
    where: { email: "admin@facility.org" },
    update: { passwordHash: hashedPassword, status: "ACTIVE" },
    create: {
      employeeCode: "EMP001",
      email: "admin@facility.org",
      passwordHash: hashedPassword,
      firstName: "John",
      lastName: "Admin",
      phoneNumber: "+15550001234",
      status: "ACTIVE",
      mfaEnabled: false,
      roleId: dbRoles["System Admin"].id,
    },
  });

  // Wuan Admin
  const wuanHashedPassword = await bcrypt.hash("123123", BCRYPT_ROUNDS);
  await prisma.user.upsert({
    where: { email: "wuan1604@gmail.com" },
    update: { passwordHash: wuanHashedPassword, status: "ACTIVE" },
    create: {
      employeeCode: "EMP_WUAN",
      email: "wuan1604@gmail.com",
      passwordHash: wuanHashedPassword,
      firstName: "Wuan",
      lastName: "Admin",
      phoneNumber: "+15559998888",
      status: "ACTIVE",
      mfaEnabled: false,
      roleId: dbRoles["System Admin"].id,
    },
  });

  // 2. DON (Director of Nursing)
  await prisma.user.upsert({
    where: { email: "don@facility.org" },
    update: { passwordHash: hashedPassword, status: "ACTIVE" },
    create: {
      employeeCode: "EMP_DON",
      email: "don@facility.org",
      passwordHash: hashedPassword,
      firstName: "Sarah",
      lastName: "Director",
      phoneNumber: "+15550002222",
      status: "ACTIVE",
      mfaEnabled: false,
      roleId: dbRoles["DON (Director of Nursing)"].id,
    },
  });

  // 3. Nurse (RN/LPN)
  await prisma.user.upsert({
    where: { email: "j.rivera@facility.org" },
    update: { passwordHash: hashedPassword, status: "ACTIVE" },
    create: {
      employeeCode: "EMP002",
      email: "j.rivera@facility.org",
      passwordHash: hashedPassword,
      firstName: "Julia",
      middleName: "Marie",
      lastName: "Rivera",
      phoneNumber: "+15550005678",
      status: "ACTIVE",
      mfaEnabled: false,
      roleId: dbRoles["Nurse (RN/LPN)"].id,
    },
  });

  await prisma.user.upsert({
    where: { email: "nurse@facility.org" },
    update: { passwordHash: hashedPassword, status: "ACTIVE" },
    create: {
      employeeCode: "EMP_NURSE",
      email: "nurse@facility.org",
      passwordHash: hashedPassword,
      firstName: "Anna",
      lastName: "Lee",
      phoneNumber: "+15550003333",
      status: "ACTIVE",
      mfaEnabled: false,
      roleId: dbRoles["Nurse (RN/LPN)"].id,
    },
  });

  // 4. CNA (Certified Nursing Assistant)
  await prisma.user.upsert({
    where: { email: "cna@facility.org" },
    update: { passwordHash: hashedPassword, status: "ACTIVE" },
    create: {
      employeeCode: "EMP_CNA",
      email: "cna@facility.org",
      passwordHash: hashedPassword,
      firstName: "Carlos",
      lastName: "Assistant",
      phoneNumber: "+15550004444",
      status: "ACTIVE",
      mfaEnabled: false,
      roleId: dbRoles["CNA"].id,
    },
  });

  // 5. Admission Staff
  await prisma.user.upsert({
    where: { email: "admission@facility.org" },
    update: { passwordHash: hashedPassword, status: "ACTIVE" },
    create: {
      employeeCode: "EMP_ADM",
      email: "admission@facility.org",
      passwordHash: hashedPassword,
      firstName: "Alice",
      lastName: "Admission",
      phoneNumber: "+15550005555",
      status: "ACTIVE",
      mfaEnabled: false,
      roleId: dbRoles["Admission Staff"].id,
    },
  });

  // 6. Physician
  await prisma.user.upsert({
    where: { email: "physician@facility.org" },
    update: { passwordHash: hashedPassword, status: "ACTIVE" },
    create: {
      employeeCode: "EMP_DOC",
      email: "physician@facility.org",
      passwordHash: hashedPassword,
      firstName: "Dr. Robert",
      lastName: "Chen",
      phoneNumber: "+15550006666",
      status: "ACTIVE",
      mfaEnabled: false,
      roleId: dbRoles["Physician"].id,
    },
  });

  // 7. Dietary
  await prisma.user.upsert({
    where: { email: "dietary@facility.org" },
    update: { passwordHash: hashedPassword, status: "ACTIVE" },
    create: {
      employeeCode: "EMP_DIET",
      email: "dietary@facility.org",
      passwordHash: hashedPassword,
      firstName: "David",
      lastName: "Dietary",
      phoneNumber: "+15550007777",
      status: "ACTIVE",
      mfaEnabled: false,
      roleId: dbRoles["Dietary"].id,
    },
  });

  const facility = await prisma.facility.upsert({
    where: { facilityCode: DEFAULT_FACILITY_CODE },
    update: {
      name: "NHMS Demo Skilled Nursing Facility",
      licenseNumber: "CA-SNF-004821",
      targetState: "CA",
      timezone: "America/Los_Angeles (Pacific)",
      phoneNumber: "+14155550142",
      isDeleted: false,
    },
    create: {
      facilityCode: DEFAULT_FACILITY_CODE,
      name: "NHMS Demo Skilled Nursing Facility",
      licenseNumber: "CA-SNF-004821",
      targetState: "CA",
      timezone: "America/Los_Angeles (Pacific)",
      phoneNumber: "+14155550142",
    },
  });

  for (const item of roomSeed) {
    const room = await prisma.rooms.upsert({
      where: {
        facility_id_room_number: {
          facility_id: facility.id,
          room_number: item.roomNumber,
        },
      },
      update: {
        room_type: item.roomType,
        is_deleted: false,
      },
      create: {
        room_number: item.roomNumber,
        room_type: item.roomType,
        facility_id: facility.id,
      },
    });

    await prisma.beds.upsert({
      where: {
        room_id_bed_number: {
          room_id: room.id,
          bed_number: item.bedNumber,
        },
      },
      update: { status: item.status },
      create: {
        bed_number: item.bedNumber,
        status: item.status,
        room_id: room.id,
      },
    });
  }

  for (const item of careLevelSeed) {
    const careLevel = await prisma.care_levels.upsert({
      where: { level_code: item.levelCode },
      update: {
        level_name: item.levelName,
        is_deleted: false,
      },
      create: {
        level_code: item.levelCode,
        level_name: item.levelName,
      },
    });

    const currentRate = await prisma.care_level_rates.findFirst({
      where: {
        care_level_id: careLevel.id,
        facility_id: facility.id,
        effective_to: null,
      },
    });

    if (currentRate) {
      await prisma.care_level_rates.update({
        where: { id: currentRate.id },
        data: {
          daily_rate: item.dailyRate,
          effective_from: toDate("2026-01-01"),
        },
      });
    } else {
      await prisma.care_level_rates.create({
        data: {
          care_level_id: careLevel.id,
          facility_id: facility.id,
          daily_rate: item.dailyRate,
          effective_from: toDate("2026-01-01"),
        },
      });
    }
  }

  for (const item of roomRateSeed) {
    await prisma.facility_room_rates.upsert({
      where: {
        facility_id_room_type: {
          facility_id: facility.id,
          room_type: item.roomType,
        },
      },
      update: {
        daily_rate: item.dailyRate,
        effective_from: toDate(item.effectiveFrom),
      },
      create: {
        facility_id: facility.id,
        room_type: item.roomType,
        daily_rate: item.dailyRate,
        effective_from: toDate(item.effectiveFrom),
      },
    });
  }

  for (const item of clinicalCapabilitySeed) {
    await prisma.facility_clinical_capabilities.upsert({
      where: {
        facility_id_capability: {
          facility_id: facility.id,
          capability: item.capability,
        },
      },
      update: {
        supported: item.supported,
        note: "note" in item ? item.note : null,
      },
      create: {
        facility_id: facility.id,
        capability: item.capability,
        supported: item.supported,
        note: "note" in item ? item.note : null,
      },
    });
  }

  const staffingConfig = await prisma.staffing_configs.findFirst({
    where: { facility_id: facility.id },
  });
  const shiftBreakdownJson = JSON.stringify([
    {
      shiftName: "Day",
      startTime: "07:00",
      endTime: "15:00",
      requiredCnaHours: 1.5,
      requiredNurseHours: 0.9,
    },
    {
      shiftName: "Evening",
      startTime: "15:00",
      endTime: "23:00",
      requiredCnaHours: 0.7,
      requiredNurseHours: 0.5,
    },
    {
      shiftName: "Night",
      startTime: "23:00",
      endTime: "07:00",
      requiredCnaHours: 0.5,
      requiredNurseHours: 0.3,
    },
  ]);

  if (staffingConfig) {
    await prisma.staffing_configs.update({
      where: { id: staffingConfig.id },
      data: {
        min_hrs_per_resident_day: 3.5,
        warn_below_percentage: 90,
        shift_breakdown_json: shiftBreakdownJson,
      },
    });
  } else {
    await prisma.staffing_configs.create({
      data: {
        facility_id: facility.id,
        min_hrs_per_resident_day: 3.5,
        warn_below_percentage: 90,
        shift_breakdown_json: shiftBreakdownJson,
      },
    });
  }

  // ── Holidays Seeding ────────────────────────────────────────────────────────
  const federalHolidaysSeed = [
    { name: "New Year's Day", dateType: "FIXED", month: 1, day: 1, floatingRule: null },
    { name: "Martin Luther King Jr. Day", dateType: "FLOATING", month: 1, day: null, floatingRule: "3rd Monday in January" },
    { name: "Washington's Birthday", dateType: "FLOATING", month: 2, day: null, floatingRule: "3rd Monday in February" },
    { name: "Memorial Day", dateType: "FLOATING", month: 5, day: null, floatingRule: "Last Monday in May" },
    { name: "Juneteenth National Independence Day", dateType: "FIXED", month: 6, day: 19, floatingRule: null },
    { name: "Independence Day", dateType: "FIXED", month: 7, day: 4, floatingRule: null },
    { name: "Labor Day", dateType: "FLOATING", month: 9, day: null, floatingRule: "1st Monday in September" },
    { name: "Columbus Day", dateType: "FLOATING", month: 10, day: null, floatingRule: "2nd Monday in October" },
    { name: "Veterans Day", dateType: "FIXED", month: 11, day: 11, floatingRule: null },
    { name: "Thanksgiving Day", dateType: "FLOATING", month: 11, day: null, floatingRule: "4th Thursday in November" },
    { name: "Christmas Day", dateType: "FIXED", month: 12, day: 25, floatingRule: null },
  ];

  for (const h of federalHolidaysSeed) {
    const existing = await prisma.holidays.findFirst({
      where: { name: h.name, is_federal_read_only: true },
    });
    if (!existing) {
      await prisma.holidays.create({
        data: {
          name: h.name,
          date_type: h.dateType,
          month: h.month,
          day: h.day,
          floating_rule: h.floatingRule,
          repeats_annually: true,
          is_active: true,
          is_federal_read_only: true,
        },
      });
    }
  }

  const caStateHolidaysSeed = [
    { name: "New Year's Day (CA)", dateType: "FIXED", month: 1, day: 1, floatingRule: null },
    { name: "Martin Luther King Jr. Day (CA)", dateType: "FLOATING", month: 1, day: null, floatingRule: "3rd Monday in January" },
    { name: "Lincoln's Birthday", dateType: "FIXED", month: 2, day: 12, floatingRule: null },
    { name: "César Chávez Day", dateType: "FIXED", month: 3, day: 31, floatingRule: null },
    { name: "Memorial Day (CA)", dateType: "FLOATING", month: 5, day: null, floatingRule: "Last Monday in May" },
    { name: "Juneteenth (CA)", dateType: "FIXED", month: 6, day: 19, floatingRule: null },
    { name: "Independence Day (CA)", dateType: "FIXED", month: 7, day: 4, floatingRule: null },
    { name: "Labor Day (CA)", dateType: "FLOATING", month: 9, day: null, floatingRule: "1st Monday in September" },
    { name: "Native American Day", dateType: "FLOATING", month: 9, day: null, floatingRule: "4th Friday in September" },
    { name: "Veterans Day (CA)", dateType: "FIXED", month: 11, day: 11, floatingRule: null },
    { name: "Thanksgiving Day (CA)", dateType: "FLOATING", month: 11, day: null, floatingRule: "4th Thursday in November" },
    { name: "Day After Thanksgiving", dateType: "FLOATING", month: 11, day: null, floatingRule: "4th Friday in November" },
    { name: "Christmas Day (CA)", dateType: "FIXED", month: 12, day: 25, floatingRule: null },
  ];

  for (const h of caStateHolidaysSeed) {
    const existing = await prisma.holidays.findFirst({
      where: { facility_id: facility.id, name: h.name },
    });
    if (!existing) {
      await prisma.holidays.create({
        data: {
          facility_id: facility.id,
          name: h.name,
          date_type: h.dateType,
          month: h.month,
          day: h.day,
          floating_rule: h.floatingRule,
          repeats_annually: true,
          is_active: true,
          is_federal_read_only: false,
        },
      });
    }
  }

  // ── Step 1: Link All Seeded Users to Facility (user_facilities) ──────────────
  console.log("[Seed] Linking staff users to facility...");
  const allStaffUsers = await prisma.user.findMany();
  const staffByEmail = new Map(allStaffUsers.map((u) => [u.email, u]));

  for (const u of allStaffUsers) {
    await prisma.userFacility.upsert({
      where: {
        userId_facilityId: {
          userId: u.id,
          facilityId: facility.id,
        },
      },
      update: { isPrimary: true },
      create: {
        userId: u.id,
        facilityId: facility.id,
        isPrimary: true,
      },
    });
  }

  // Ensure Room 101 has Bed B
  const room101 = await prisma.rooms.findFirst({ where: { facility_id: facility.id, room_number: "101" } });
  if (room101) {
    await prisma.beds.upsert({
      where: { room_id_bed_number: { room_id: room101.id, bed_number: "B" } },
      update: { status: "OCCUPIED" },
      create: { room_id: room101.id, bed_number: "B", status: "OCCUPIED" },
    });
  }

  const allBeds = await prisma.beds.findMany({ include: { rooms: true } });
  const bedMap = new Map(allBeds.map((b) => [`${b.rooms.room_number}-${b.bed_number}`, b]));

  const allCareLevels = await prisma.care_levels.findMany();
  const careLevelMap = new Map(allCareLevels.map((c) => [c.level_code, c]));

  // ── Step 2: Incident Severities & SLA Configurations ────────────────────────
  console.log("[Seed] Seeding Incident Severities & SLA Configs...");
  const severitiesSeed = [
    { level_name: "LOW", chart_lock_trigger: false, description: "Minor event with no resident injury (e.g. minor bruise, property damage)." },
    { level_name: "MEDIUM", chart_lock_trigger: false, description: "Moderate incident requiring first aid, physician notification, or monitoring." },
    { level_name: "HIGH", chart_lock_trigger: true, description: "Critical incident requiring hospital transfer, severe injury, or mandatory state report." },
  ];

  const dbSeverities: Record<string, any> = {};
  for (const s of severitiesSeed) {
    let sev = await prisma.incident_severities.findFirst({ where: { level_name: s.level_name } });
    if (!sev) {
      sev = await prisma.incident_severities.create({ data: s });
    } else {
      sev = await prisma.incident_severities.update({ where: { id: sev.id }, data: s });
    }
    dbSeverities[s.level_name] = sev;
  }

  const slaConfigsSeed = [
    { severity_id: dbSeverities["LOW"].id, sla_window_hrs: 72, external_report_required: false, regulatory_body: null },
    { severity_id: dbSeverities["MEDIUM"].id, sla_window_hrs: 48, external_report_required: false, regulatory_body: null },
    { severity_id: dbSeverities["HIGH"].id, sla_window_hrs: 24, external_report_required: true, regulatory_body: "California Dept of Public Health (CDPH)" },
  ];

  for (const sla of slaConfigsSeed) {
    const existing = await prisma.sla_configs.findFirst({ where: { severity_id: sla.severity_id } });
    if (!existing) {
      await prisma.sla_configs.create({ data: sla });
    }
  }

  // ── Step 3: Assessment Metrics ──────────────────────────────────────────────
  console.log("[Seed] Seeding Assessment Metrics...");
  const metricsSeed = [
    { category: "ADL", metric_name: "Bathing" },
    { category: "ADL", metric_name: "Dressing" },
    { category: "ADL", metric_name: "Eating" },
    { category: "ADL", metric_name: "Toileting" },
    { category: "ADL", metric_name: "Transferring" },
    { category: "ADL", metric_name: "Personal Hygiene" },
    { category: "MOBILITY", metric_name: "Bed Mobility" },
    { category: "MOBILITY", metric_name: "Locomotion / Ambulation" },
    { category: "COGNITIVE", metric_name: "Memory & Orientation" },
    { category: "COGNITIVE", metric_name: "Decision Making" },
  ];

  const dbMetrics: Record<string, any> = {};
  for (const m of metricsSeed) {
    let metric = await prisma.assessment_metrics.findFirst({
      where: { category: m.category, metric_name: m.metric_name },
    });
    if (!metric) {
      metric = await prisma.assessment_metrics.create({ data: m });
    }
    dbMetrics[m.metric_name] = metric;
  }

  // ── Step 4: Shifts & Shift Assignments for Today ────────────────────────────
  console.log("[Seed] Seeding Shifts & Shift Assignments...");
  const shiftsSeed = [
    { shift_name: "Day", start_time: new Date("1970-01-01T07:00:00Z"), end_time: new Date("1970-01-01T15:30:00Z") },
    { shift_name: "Evening", start_time: new Date("1970-01-01T15:00:00Z"), end_time: new Date("1970-01-01T23:30:00Z") },
    { shift_name: "Night", start_time: new Date("1970-01-01T23:00:00Z"), end_time: new Date("1970-01-01T07:30:00Z") },
  ];

  const dbShifts: Record<string, any> = {};
  for (const sh of shiftsSeed) {
    let shift = await prisma.shifts.findFirst({
      where: { facility_id: facility.id, shift_name: sh.shift_name },
    });
    if (!shift) {
      shift = await prisma.shifts.create({
        data: {
          facility_id: facility.id,
          shift_name: sh.shift_name,
          start_time: sh.start_time,
          end_time: sh.end_time,
        },
      });
    }
    dbShifts[sh.shift_name] = shift;
  }

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const cnaUser = staffByEmail.get("cna@facility.org");
  const nurseRivera = staffByEmail.get("j.rivera@facility.org");
  const donUser = staffByEmail.get("don@facility.org");
  const docChen = staffByEmail.get("physician@facility.org");
  const dietDavid = staffByEmail.get("dietary@facility.org");
  const admAlice = staffByEmail.get("admission@facility.org");

  if (cnaUser && dbShifts["Day"]) {
    const existingAssign = await prisma.shift_assignments.findFirst({
      where: { shift_id: dbShifts["Day"].id, user_id: cnaUser.id, work_date: todayDate },
    });
    if (!existingAssign) {
      await prisma.shift_assignments.create({
        data: {
          shift_id: dbShifts["Day"].id,
          user_id: cnaUser.id,
          work_date: todayDate,
          status: "ON_DUTY",
          clock_in_at: new Date(Date.now() - 3 * 3600 * 1000),
        },
      });
    }
  }

  if (nurseRivera && dbShifts["Day"]) {
    const existingAssign = await prisma.shift_assignments.findFirst({
      where: { shift_id: dbShifts["Day"].id, user_id: nurseRivera.id, work_date: todayDate },
    });
    if (!existingAssign) {
      await prisma.shift_assignments.create({
        data: {
          shift_id: dbShifts["Day"].id,
          user_id: nurseRivera.id,
          work_date: todayDate,
          status: "ON_DUTY",
          clock_in_at: new Date(Date.now() - 3 * 3600 * 1000),
        },
      });
    }
  }

  // ── Step 5: Inventory Categories, DME & Consumables ─────────────────────────
  console.log("[Seed] Seeding Inventory Categories, DME & Supplies...");
  const invCategoriesSeed = [
    { category_name: "Mobility & Support", description: "Wheelchairs, walkers, hoyer lifts, and transfer aids." },
    { category_name: "Respiratory Care", description: "Oxygen concentrators, nebulizers, and CPAP machines." },
    { category_name: "Wound Care & PPE", description: "Dressings, sterile gauze, exam gloves, and wound care kits." },
    { category_name: "Diagnostic & Monitoring", description: "Blood pressure monitors, pulse oximeters, and glucose meters." },
  ];

  const dbInvCats: Record<string, any> = {};
  for (const c of invCategoriesSeed) {
    const cat = await prisma.inventory_categories.upsert({
      where: { category_name: c.category_name },
      update: { description: c.description },
      create: c,
    });
    dbInvCats[c.category_name] = cat;
  }

  const dmeSeed = [
    { item_name: "Standard Wheelchair (Drive Medical)", category_id: dbInvCats["Mobility & Support"].id, asset_tag: "DME-WC-001", status: "AVAILABLE", unit_value: 350 },
    { item_name: "Motorized Wheelchair (Invacare Power)", category_id: dbInvCats["Mobility & Support"].id, asset_tag: "DME-WC-002", status: "IN_USE", unit_value: 1850 },
    { item_name: "DeVilbiss 525DS 5L Oxygen Concentrator", category_id: dbInvCats["Respiratory Care"].id, asset_tag: "DME-OX-001", status: "AVAILABLE", unit_value: 890 },
    { item_name: "Full Electric Hospital Bed (Hill-Rom)", category_id: dbInvCats["Mobility & Support"].id, asset_tag: "DME-BED-001", status: "IN_USE", unit_value: 2400 },
    { item_name: "Hoyer Hydraulic Resident Lift", category_id: dbInvCats["Mobility & Support"].id, asset_tag: "DME-LIFT-001", status: "MAINTENANCE", unit_value: 1200 },
  ];

  for (const d of dmeSeed) {
    await prisma.durable_medical_equipment.upsert({
      where: { asset_tag: d.asset_tag },
      update: { status: d.status, unit_value: d.unit_value, is_deleted: false },
      create: {
        item_name: d.item_name,
        category_id: d.category_id,
        asset_tag: d.asset_tag,
        status: d.status,
        facility_id: BigInt(1),
        unit_value: d.unit_value,
        is_deleted: false,
      },
    });
  }

  const consumablesSeed = [
    { item_name: "Sterile Bordered Gauze 4x4 (Box of 50)", category_id: dbInvCats["Wound Care & PPE"].id, stock_on_hand: 25, total: 30, reorder_threshold: 10, unit_cost: 18.5, private_pay_rate: 28, status: "OK" },
    { item_name: "Nitrile Exam Gloves - Medium (Box of 100)", category_id: dbInvCats["Wound Care & PPE"].id, stock_on_hand: 4, total: 50, reorder_threshold: 15, unit_cost: 12, private_pay_rate: 18, status: "LOW_STOCK" },
    { item_name: "Adult Incontinence Briefs - Large (Pack of 30)", category_id: dbInvCats["Wound Care & PPE"].id, stock_on_hand: 40, total: 60, reorder_threshold: 20, unit_cost: 22, private_pay_rate: 34, status: "OK" },
    { item_name: "Blood Glucose Test Strips (Pack of 50)", category_id: dbInvCats["Diagnostic & Monitoring"].id, stock_on_hand: 3, total: 20, reorder_threshold: 10, unit_cost: 29, private_pay_rate: 45, status: "LOW_STOCK" },
    { item_name: "Normal Saline 0.9% Flush Syringes 10mL", category_id: dbInvCats["Wound Care & PPE"].id, stock_on_hand: 85, total: 100, reorder_threshold: 30, unit_cost: 0.85, private_pay_rate: 2.5, status: "OK" },
  ];

  for (const c of consumablesSeed) {
    const existing = await prisma.consumable_supplies.findFirst({
      where: { item_name: c.item_name, category_id: c.category_id },
    });
    if (!existing) {
      await prisma.consumable_supplies.create({
        data: {
          item_name: c.item_name,
          category_id: c.category_id,
          facility_id: BigInt(1),
          stock_on_hand: c.stock_on_hand,
          total: c.total,
          reorder_threshold: c.reorder_threshold,
          unit_cost: c.unit_cost,
          private_pay_rate: c.private_pay_rate,
          status: c.status,
          is_deleted: false,
        },
      });
    }
  }

  // ── Step 6: Seed Residents across all clinical states ────────────────────────
  console.log("[Seed] Seeding realistic Residents, Assessments, Plans & Tasks...");

  interface SeedResidentDef {
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    maritalStatus: string;
    status: string;
    bedCode: string | null;
    tierCode: string;
    adlScore: number;
    isOverridden?: boolean;
    carePlanStatus: string;
    isChartLocked?: boolean;
  }

  const residentsSeed: SeedResidentDef[] = [
    { firstName: "Eleanor", lastName: "Vance", dob: "1942-03-15", gender: "FEMALE", maritalStatus: "WIDOWED", status: "ACTIVE", bedCode: "101-A", tierCode: "ASSISTED_LIVING", adlScore: 10, carePlanStatus: "SIGNED" },
    { firstName: "Arthur", lastName: "Pendelton", dob: "1938-07-22", gender: "MALE", maritalStatus: "MARRIED", status: "ACTIVE", bedCode: "106-A", tierCode: "MEMORY_CARE", adlScore: 16, carePlanStatus: "PENDING_REVIEW" },
    { firstName: "Dorothy", lastName: "Gale", dob: "1945-11-09", gender: "FEMALE", maritalStatus: "SINGLE", status: "ACTIVE", bedCode: "114-B", tierCode: "INDEPENDENT_LIVING", adlScore: 5, carePlanStatus: "DRAFT" },
    { firstName: "Robert", lastName: "Martinez", dob: "1935-01-18", gender: "MALE", maritalStatus: "WIDOWED", status: "ACTIVE", bedCode: "118-A", tierCode: "SKILLED_NURSING", adlScore: 22, carePlanStatus: "APPROVED" },
    { firstName: "Beatrice", lastName: "Campbell", dob: "1940-09-04", gender: "FEMALE", maritalStatus: "MARRIED", status: "ACTIVE", bedCode: "204-B", tierCode: "MEMORY_CARE", adlScore: 15, carePlanStatus: "SIGNED" },
    { firstName: "Walter", lastName: "White", dob: "1948-05-12", gender: "MALE", maritalStatus: "MARRIED", status: "ACTIVE", bedCode: "210-B", tierCode: "SKILLED_NURSING", adlScore: 21, carePlanStatus: "SIGNED", isChartLocked: true },
    { firstName: "Frank", lastName: "Sinatra", dob: "1944-12-12", gender: "MALE", maritalStatus: "DIVORCED", status: "ACTIVE", bedCode: "222-A", tierCode: "ASSISTED_LIVING", adlScore: 11, carePlanStatus: "SIGNED" },
    { firstName: "Helen", lastName: "Keller", dob: "1939-06-27", gender: "FEMALE", maritalStatus: "SINGLE", status: "ACTIVE", bedCode: "101-B", tierCode: "SKILLED_NURSING", adlScore: 12, isOverridden: true, carePlanStatus: "APPROVED" },
    { firstName: "Margaret", lastName: "Thatcher", dob: "1941-10-13", gender: "FEMALE", maritalStatus: "WIDOWED", status: "PENDING", bedCode: null, tierCode: "ASSISTED_LIVING", adlScore: 8, carePlanStatus: "DRAFT" },
    { firstName: "Harold", lastName: "Finch", dob: "1936-04-02", gender: "MALE", maritalStatus: "SINGLE", status: "DISCHARGED", bedCode: null, tierCode: "SKILLED_NURSING", adlScore: 24, carePlanStatus: "SIGNED" },
  ];

  const nurseAssessor = nurseRivera || allStaffUsers[0];

  for (const rDef of residentsSeed) {
    let resident = await prisma.residents.findFirst({
      where: { first_name: rDef.firstName, last_name: rDef.lastName },
    });

    const bedRecord = rDef.bedCode ? bedMap.get(rDef.bedCode) : null;

    if (!resident) {
      resident = await prisma.residents.create({
        data: {
          first_name: rDef.firstName,
          last_name: rDef.lastName,
          date_of_birth: new Date(`${rDef.dob}T00:00:00Z`),
          gender: rDef.gender,
          marital_status: rDef.maritalStatus,
          status: rDef.status,
          bed_id: bedRecord?.id ?? null,
          is_chart_locked: rDef.isChartLocked ?? false,
        },
      });
    } else {
      resident = await prisma.residents.update({
        where: { id: resident.id },
        data: {
          status: rDef.status,
          bed_id: bedRecord?.id ?? null,
          is_chart_locked: rDef.isChartLocked ?? false,
          is_deleted: false,
        },
      });
    }

    // Admission record
    const existingAdm = await prisma.admissions.findFirst({ where: { resident_id: resident.id } });
    if (!existingAdm) {
      const isDischarged = rDef.status === "DISCHARGED";
      await prisma.admissions.create({
        data: {
          resident_id: resident.id,
          facility_id: facility.id,
          admission_date: new Date(Date.now() - 45 * 24 * 3600 * 1000),
          discharge_date: isDischarged ? new Date(Date.now() - 14 * 24 * 3600 * 1000) : null,
          discharge_reason: isDischarged ? "Transferred to Community Hospice with Family Support" : null,
        },
      });
    }

    // Sensitive info
    await prisma.resident_sensitive_info.upsert({
      where: { resident_id: resident.id },
      update: {},
      create: {
        resident_id: resident.id,
        medical_record_number_encrypted: `MRN-${resident.id.slice(0, 8).toUpperCase()}`,
        ssn_encrypted: `***-**-${Math.floor(1000 + Math.random() * 9000)}`,
      },
    });

    // Emergency Contact
    const existingContact = await prisma.resident_contacts.findFirst({ where: { resident_id: resident.id } });
    if (!existingContact) {
      const contact = await prisma.contacts.create({
        data: {
          first_name: "Family",
          last_name: rDef.lastName,
          phone_primary: "+1555" + Math.floor(1000000 + Math.random() * 9000000),
          email: `${rDef.firstName.toLowerCase()}.family@example.org`,
        },
      });
      await prisma.resident_contacts.create({
        data: {
          resident_id: resident.id,
          contact_id: contact.id,
          relationship_type: "Emergency Contact",
          is_emergency_contact: true,
          is_primary: true,
        },
      });
    } else {
      await prisma.resident_contacts.update({
        where: { id: existingContact.id },
        data: {
          is_emergency_contact: true,
          is_primary: true,
        },
      });
    }

    // Pre-admission screening for Margaret Thatcher
    if (rDef.firstName === "Margaret" && admAlice) {
      const existingScreening = await prisma.pre_admission_screenings.findFirst({ where: { resident_id: resident.id } });
      if (!existingScreening) {
        await prisma.pre_admission_screenings.create({
          data: {
            resident_id: resident.id,
            screened_by: admAlice.id,
            status: "APPROVED",
          },
        });
      }
    }

    // Care level & Assessment
    const targetLevel = careLevelMap.get(rDef.tierCode) || allCareLevels[0];
    const suggestedLevel = rDef.isOverridden ? (careLevelMap.get("ASSISTED_LIVING") || targetLevel) : targetLevel;

    const existingAssessment = await prisma.assessments.findFirst({ where: { resident_id: resident.id } });
    let assessmentId: string;
    if (!existingAssessment) {
      const assessment = await prisma.assessments.create({
        data: {
          resident_id: resident.id,
          assessed_by: nurseAssessor.id,
          suggested_care_level_id: suggestedLevel.id,
          confirmed_care_level_id: targetLevel.id,
          adl_total_score: rDef.adlScore,
          is_overridden: rDef.isOverridden ?? false,
          created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000),
        },
      });
      assessmentId = assessment.id;

      // Seed details
      if (dbMetrics["Bathing"]) {
        await prisma.assessment_details.create({
          data: {
            assessment_id: assessmentId,
            metric_id: dbMetrics["Bathing"].id,
            score: Math.min(4, Math.floor(rDef.adlScore / 5)),
            notes: "Requires assistance with lower body washing and transfer into shower bench.",
          },
        });
      }
      if (dbMetrics["Transferring"]) {
        await prisma.assessment_details.create({
          data: {
            assessment_id: assessmentId,
            metric_id: dbMetrics["Transferring"].id,
            score: Math.min(4, Math.floor(rDef.adlScore / 4)),
            notes: rDef.isOverridden
              ? "OVERRIDE JUSTIFICATION: Resident exhibits severe bilateral sensory deficit with acute neurological decline requiring 2-person assist for all transfers."
              : "1-person assist with gait belt.",
          },
        });
      }
    } else {
      assessmentId = existingAssessment.id;
    }

    // Care Level History
    const existingHistory = await prisma.resident_care_level_history.findFirst({ where: { resident_id: resident.id } });
    if (!existingHistory) {
      await prisma.resident_care_level_history.create({
        data: {
          resident_id: resident.id,
          care_level_id: targetLevel.id,
          start_date: new Date(Date.now() - 30 * 24 * 3600 * 1000),
        },
      });
    }

    // Care Plan
    let carePlan = await prisma.care_plans.findFirst({ where: { resident_id: resident.id } });
    if (!carePlan) {
      carePlan = await prisma.care_plans.create({
        data: {
          resident_id: resident.id,
          created_by: nurseAssessor.id,
          status: rDef.carePlanStatus,
          significant_change_flag: false,
        },
      });

      // Goals & Interventions
      const goal = await prisma.care_goals.create({
        data: {
          care_plan_id: carePlan.id,
          description: `Maintain ADL functional mobility and prevent falls (${rDef.firstName} ${rDef.lastName})`,
          status: "IN_PROGRESS",
        },
      });

      const intervention1 = await prisma.care_interventions.create({
        data: {
          care_plan_id: carePlan.id,
          description: "Assist with morning hygiene, bathing, and safe bed-to-chair transfer.",
          assigned_role: "CNA",
        },
      });

      const intervention2 = await prisma.care_interventions.create({
        data: {
          care_plan_id: carePlan.id,
          description: "Monitor vitals, respiratory status, and skin integrity BID.",
          assigned_role: "Nurse (RN/LPN)",
        },
      });

      // Today's Care Tasks
      const startToday = new Date();
      startToday.setHours(8, 0, 0, 0);

      const task1Time = new Date(startToday.getTime() + 30 * 60 * 1000); // 08:30 today
      const task2Time = new Date(startToday.getTime() + 150 * 60 * 1000); // 10:30 today
      const task3Time = new Date(startToday.getTime() + 360 * 60 * 1000); // 14:00 today

      if (rDef.status === "ACTIVE") {
        const isFrank = rDef.firstName === "Frank";

        await prisma.care_tasks.create({
          data: {
            care_intervention_id: intervention1.id,
            task_type: "BATHING",
            status: "COMPLETED",
            is_abnormal_flagged: false,
            assigned_cna_id: cnaUser?.id,
            scheduled_time: task1Time,
            completed_at: new Date(task1Time.getTime() + 25 * 60 * 1000),
          },
        });

        await prisma.care_tasks.create({
          data: {
            care_intervention_id: intervention2.id,
            task_type: "VITALS",
            status: "COMPLETED",
            is_abnormal_flagged: isFrank, // Frank triggers abnormal vitals alert badge!
            assigned_cna_id: cnaUser?.id,
            scheduled_time: task2Time,
            completed_at: new Date(task2Time.getTime() + 15 * 60 * 1000),
          },
        });

        await prisma.care_tasks.create({
          data: {
            care_intervention_id: intervention1.id,
            task_type: "ASSISTANCE",
            status: "PENDING",
            is_abnormal_flagged: false,
            assigned_cna_id: cnaUser?.id,
            scheduled_time: task3Time,
          },
        });
      }

      // DON Review / eSignatures / IDT
      if (rDef.carePlanStatus === "APPROVED" && donUser) {
        await prisma.care_plan_reviews.create({
          data: {
            care_plan_id: carePlan.id,
            reviewer_id: donUser.id,
            status: "APPROVED",
            notes: "Comprehensive care plan reviewed and clinically approved for active implementation.",
          },
        });
      }

      if (rDef.carePlanStatus === "SIGNED" && docChen && dietDavid) {
        await prisma.care_plan_signatures.create({
          data: {
            care_plan_id: carePlan.id,
            signer_id: docChen.id,
            signature_token: `ESIGN-DOC-${Date.now()}-${carePlan.id.slice(0, 4)}`,
          },
        });
        await prisma.care_plan_signatures.create({
          data: {
            care_plan_id: carePlan.id,
            signer_id: dietDavid.id,
            signature_token: `ESIGN-DIET-${Date.now()}-${carePlan.id.slice(0, 4)}`,
          },
        });
        if (nurseRivera) {
          await prisma.idt_acknowledgments.create({
            data: {
              care_plan_id: carePlan.id,
              user_id: nurseRivera.id,
              notes: "Interdisciplinary team review confirmed goals align with resident capabilities.",
            },
          });
        }
      }
    }

    // ── Vital Signs ─────────────────────────────────────────────────────────
    const existingVitals = await prisma.vital_signs.findFirst({ where: { resident_id: resident.id } });
    if (!existingVitals && nurseRivera && rDef.status === "ACTIVE") {
      const isFrank = rDef.firstName === "Frank";
      const recordedAt = new Date(Date.now() - (isFrank ? 2 : 4) * 3600 * 1000);

      await prisma.vital_signs.create({
        data: {
          resident_id: resident.id,
          recorded_by: nurseRivera.id,
          blood_pressure_systolic: isFrank ? 185 : 122,
          blood_pressure_diastolic: isFrank ? 110 : 78,
          heart_rate_bpm: isFrank ? 118 : 74,
          respiratory_rate: isFrank ? 24 : 16,
          temperature_fahrenheit: isFrank ? 101.2 : 98.4,
          spo2_percentage: isFrank ? 87 : 98,
          pain_scale: isFrank ? 8 : 2,
          notes: isFrank
            ? "CRITICAL: Resident dyspneic, cyanotic nail beds. 2L O2 administered via nasal cannula. Physician alerted."
            : "Resident in good spirits, resting in room.",
          recorded_at: recordedAt,
        },
      });
    }

    // ── Incidents & Chart Lock ──────────────────────────────────────────────
    if (rDef.firstName === "Walter" && nurseRivera) {
      const existingInc = await prisma.incidents.findFirst({ where: { resident_id: resident.id } });
      if (!existingInc) {
        const highSev = dbSeverities["HIGH"];
        const inc = await prisma.incidents.create({
          data: {
            incident_type: "FALL",
            status: "OPEN",
            description: "Resident unassisted transfer attempt from wheelchair to bed resulted in mechanical fall. Possible right hip contusion. Emergency physician alerted.",
            sla_deadline: new Date(Date.now() + 18 * 3600 * 1000), // 18h remaining
            resident_id: resident.id,
            severity_id: highSev.id,
            reported_by: nurseRivera.id,
          },
        });
        await prisma.chart_lock_events.create({
          data: {
            incident_id: inc.id,
            locked_by_system: true,
            lock_reason: "High severity fall incident triggered automated chart lock pending clinical investigation.",
          },
        });
      }
    }

    if (rDef.firstName === "Frank" && nurseRivera) {
      const existingInc = await prisma.incidents.findFirst({ where: { resident_id: resident.id } });
      if (!existingInc) {
        const medSev = dbSeverities["MEDIUM"];
        await prisma.incidents.create({
          data: {
            incident_type: "RESPIRATORY",
            status: "INVESTIGATING",
            description: "Acute hypertensive crisis (185/110) and oxygen desaturation (SpO2 87%). Immediate clinical intervention required.",
            sla_deadline: new Date(Date.now() + 36 * 3600 * 1000),
            resident_id: resident.id,
            severity_id: medSev.id,
            reported_by: nurseRivera.id,
          },
        });
      }
    }

    // ── Invoices & Billing ──────────────────────────────────────────────────
    const existingInvoice = await prisma.invoices.findFirst({ where: { resident_id: resident.id } });
    if (!existingInvoice && rDef.status === "ACTIVE") {
      const isWalter = rDef.firstName === "Walter";
      const isEleanor = rDef.firstName === "Eleanor";
      const isFrank = rDef.firstName === "Frank";

      const invStatus = isWalter ? "DRAFT" : isEleanor ? "PAID" : isFrank ? "OVERDUE" : "PENDING";
      const invTotal = isWalter ? 9610 : isEleanor ? 6355 : isFrank ? 5850 : 7688;
      const medicareCovered = isWalter ? 7688 : 0;
      const patientResp = invTotal - medicareCovered;

      const invoice = await prisma.invoices.create({
        data: {
          resident_id: resident.id,
          billing_period_start: new Date("2026-08-01T00:00:00Z"),
          billing_period_end: new Date("2026-08-31T00:00:00Z"),
          total_amount: invTotal,
          medicare_covered_amount: medicareCovered,
          patient_responsibility_amount: patientResp,
          status: invStatus,
          due_date: new Date(Date.now() + (isEleanor ? -10 : isFrank ? -5 : 15) * 24 * 3600 * 1000),
        },
      });

      await prisma.invoice_line_items.create({
        data: {
          invoice_id: invoice.id,
          description: `Room & Board + ${targetLevel.level_name} Daily Rate (31 Days)`,
          item_type: "CARE_LEVEL_ROOM_BOARD",
          amount: invTotal,
        },
      });

      if (isEleanor && admAlice) {
        await prisma.payments.create({
          data: {
            invoice_id: invoice.id,
            payer_type: "PRIVATE_PAY",
            payment_method: "ACH_TRANSFER",
            amount: invTotal,
            received_by: admAlice.id,
            paid_at: new Date(Date.now() - 12 * 24 * 3600 * 1000),
          },
        });
      }
    }
  }

  console.log("[Seed] All clinical modules, residents, care plans, vitals, tasks, incidents, and invoices seeded successfully.");
  console.log("[Seed] Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
