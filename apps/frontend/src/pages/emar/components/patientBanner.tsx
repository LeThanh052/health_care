import React from "react";
import { User, AlertTriangle, ShieldAlert, HeartPulse, Activity } from "lucide-react";
import type { EmarResidentProfile } from "../../../services/emar";

interface PatientBannerProps {
  resident: EmarResidentProfile["resident"];
}

export const PatientBanner: React.FC<PatientBannerProps> = ({ resident }) => {
  const initials = resident.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="bg-white rounded-xl p-6 shadow-2xs border border-slate-200 relative overflow-hidden">
      {/* Chart Lock Banner */}
      {resident.isChartLocked && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-amber-800 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Clinical Chart is currently LOCKED due to an active incident investigation. Administration of scheduled medications must follow supervisory protocols.
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl border border-blue-200 shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{resident.name}</h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                {resident.code}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                {resident.careLevel}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-slate-500 mt-1.5 font-medium">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> {resident.gender}, {resident.age} yrs
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>Room: <strong className="text-slate-800">{resident.room}</strong></span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>Primary Diagnosis: <strong className="text-slate-700">{resident.primaryDiagnosis}</strong></span>
            </div>

            {resident.latestVitals && (
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1 text-slate-500">
                  <Activity className="w-3.5 h-3.5 text-blue-500" /> Blood Pressure: <strong className="text-slate-800">{resident.latestVitals.bp}</strong>
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Pulse: <strong className="text-slate-800">{resident.latestVitals.hr} bpm</strong>
                </span>
                <span className="text-slate-500">
                  SpO2: <strong className="text-slate-800">{resident.latestVitals.spo2}%</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Allergies Alert Box */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-3 w-full lg:w-auto min-w-[240px]">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Allergies & Contraindications</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {resident.allergies.length > 0 ? (
                  resident.allergies.map((allergy, i) => (
                    <span key={i} className="text-xs font-bold text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded border border-rose-200">
                      {allergy}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-rose-700 font-medium">No Known Drug Allergies (NKDA)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
