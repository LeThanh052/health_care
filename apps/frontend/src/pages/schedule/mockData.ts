import type { DoctorSchedule } from "./types";

export const getMockSchedules = (_year: number, _month: number): Record<number, DoctorSchedule[]> => {
  return {
    1: [
      {
        id: "01",
        doctorId: "3c620026-0dc5-40a3-b13f-d966cfcb9a18",
        doctorName: "Dr. Robert Chen",
        time: "09:00 AM",
        description: "Morning Clinical Rounds — Rooms 101 to 106",
        colorVariant: "blue",
      },
      {
        id: "02",
        doctorId: "3c620026-0dc5-40a3-b13f-d966cfcb9a18",
        doctorName: "Dr. Robert Chen",
        time: "02:00 PM",
        description: "Care Plan Review & IDT Consultation",
        colorVariant: "teal",
      },
    ],
    4: [
      {
        id: "03",
        doctorId: "3c620026-0dc5-40a3-b13f-d966cfcb9a18",
        doctorName: "Dr. Robert Chen",
        time: "10:00 AM",
        description: "Geriatric Assessment with Harold Finch (Room 106)",
        colorVariant: "blue",
      },
    ],
    7: [
      {
        id: "04",
        doctorId: "3c620026-0dc5-40a3-b13f-d966cfcb9a18",
        doctorName: "Dr. Robert Chen",
        time: "09:30 AM",
        description: "Hypertension & Cardiac Follow-up with Margaret Thatcher (Room 215)",
        colorVariant: "teal",
      },
      {
        id: "05",
        doctorId: "3c620026-0dc5-40a3-b13f-d966cfcb9a18",
        doctorName: "Dr. Robert Chen",
        time: "03:00 PM",
        description: "eMAR Medication Adjustment Consultation",
        colorVariant: "blue",
      },
    ],
    11: [
      {
        id: "06",
        doctorId: "3c620026-0dc5-40a3-b13f-d966cfcb9a18",
        doctorName: "Dr. Robert Chen",
        time: "11:00 AM",
        description: "Routine Physical Examination with Nguyen Van An (Room A-104)",
        colorVariant: "blue",
      },
    ],
    14: [
      {
        id: "07",
        doctorId: "3c620026-0dc5-40a3-b13f-d966cfcb9a18",
        doctorName: "Dr. Robert Chen",
        time: "09:00 AM",
        description: "Cognitive Health Evaluation with Helen Keller (Room 101-B)",
        colorVariant: "teal",
      },
    ],
    18: [
      {
        id: "08",
        doctorId: "3c620026-0dc5-40a3-b13f-d966cfcb9a18",
        doctorName: "Dr. Robert Chen",
        time: "10:00 AM",
        description: "Mid-month Clinical Rounds — Assisted Living Ward",
        colorVariant: "blue",
      },
      {
        id: "09",
        doctorId: "3c620026-0dc5-40a3-b13f-d966cfcb9a18",
        doctorName: "Dr. Robert Chen",
        time: "02:30 PM",
        description: "Specialist Follow-up with Frank Sinatra (Room 222-A)",
        colorVariant: "teal",
      },
    ],
    21: [
      {
        id: "10",
        doctorId: "3c620026-0dc5-40a3-b13f-d966cfcb9a18",
        doctorName: "Dr. Robert Chen",
        time: "09:00 AM",
        description: "Pre-admission Health Screening Consultation",
        colorVariant: "blue",
      },
    ],
    25: [
      {
        id: "11",
        doctorId: "3c620026-0dc5-40a3-b13f-d966cfcb9a18",
        doctorName: "Dr. Robert Chen",
        time: "11:00 AM",
        description: "Quarterly LOC Tier Review & Clinical Audit",
        colorVariant: "teal",
      },
    ],
    28: [
      {
        id: "12",
        doctorId: "3c620026-0dc5-40a3-b13f-d966cfcb9a18",
        doctorName: "Dr. Robert Chen",
        time: "10:00 AM",
        description: "Interdisciplinary Team (IDT) Care Plan Sign-off",
        colorVariant: "blue",
      },
    ],
  };
};
