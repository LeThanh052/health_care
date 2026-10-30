import React, { useEffect, useState } from "react";
import {
  Printer,
  Users,
  ShieldAlert,
  ClipboardList,
  Pill,
  Building,
  RefreshCw,
  HeartPulse,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  reportsService,
  type ReportsSummaryData,
  type CensusReportData,
  type IncidentReportItem,
  type MedicationAdherenceItem,
} from "../../services/reports";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

type ReportTab = "census" | "incidents" | "carePlans" | "medications";

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>("census");
  const [summary, setSummary] = useState<ReportsSummaryData | null>(null);
  const [census, setCensus] = useState<CensusReportData | null>(null);
  const [incidents, setIncidents] = useState<IncidentReportItem[]>([]);
  const [medLogs, setMedLogs] = useState<MedicationAdherenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumData, censusData, incData, medData] = await Promise.all([
        reportsService.getSummary(),
        reportsService.getCensus(),
        reportsService.getIncidents(),
        reportsService.getMedications(),
      ]);
      setSummary(sumData);
      setCensus(censusData);
      setIncidents(incData);
      setMedLogs(medData);
    } catch (err: any) {
      setError(err.message || "Failed to load reports data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReports();
  }, []);

  if (isLoading) return <LoadingState />;
  if (error || !summary) return <ErrorState onRetry={fetchAllReports} />;

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="p-6 md:p-8 space-y-6 bg-slate-50 min-h-full print:p-0 print:bg-white">
      {/* Header (Resident-matching style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Reports</span>
            <span>&gt;</span>
            <span>Executive Analytics & Compliance</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Executive Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time regulatory census, clinical risk alerts, care planning compliance, and medication adherence
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={fetchAllReports}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Export / Print Report</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards (Matching Residents List SC_017 design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Occupancy */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Bed Occupancy Rate</p>
            <p className="text-2xl font-bold text-slate-900">{summary.census.occupancyRate}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {summary.census.activeResidents} / {summary.census.totalBeds} occupied ({summary.census.availableBeds} available)
            </p>
          </div>
        </div>

        {/* KPI 2: Care Plans */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Care Plans Signed</p>
            <p className="text-2xl font-bold text-slate-900">
              {summary.carePlans.signed + summary.carePlans.approved} / {summary.carePlans.total}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {summary.carePlans.pendingReview} pending review · {summary.carePlans.draft} drafts
            </p>
          </div>
        </div>

        {/* KPI 3: Incidents & Chart Lock */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Incidents</p>
            <p className="text-2xl font-bold text-slate-900">{summary.incidents.open}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {summary.incidents.chartLockedCount} chart(s) sealed under lock
            </p>
          </div>
        </div>

        {/* KPI 4: eMAR Adherence */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">eMAR Adherence</p>
            <p className="text-2xl font-bold text-slate-900">{summary.medications.adherenceRate}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {summary.medications.dosesGiven} doses given · {summary.medications.dosesMissed} missed
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 print:hidden">
        {[
          { id: "census", label: "Census & Demographics", icon: Users },
          { id: "incidents", label: "Incident & Safety Analytics", icon: ShieldAlert },
          { id: "carePlans", label: "Care Planning Compliance", icon: ClipboardList },
          { id: "medications", label: "eMAR Medication Adherence", icon: Pill },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-white text-blue-700 shadow-2xs border border-slate-200 border-b-2 border-b-blue-600"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CENSUS & DEMOGRAPHICS */}
      {activeTab === "census" && census && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Care Levels Distribution */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs lg:col-span-1">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-blue-600" />
                <span>Level of Care (LOC) Distribution</span>
              </h3>
              <div className="space-y-3">
                {Object.entries(summary.census.careLevels).map(([level, count]) => {
                  const pct = summary.census.totalResidents > 0
                    ? Math.round((count / summary.census.totalResidents) * 100)
                    : 0;
                  return (
                    <div key={level}>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>{level}</span>
                        <span>{count} residents ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Demographics: Gender & Age */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Age Cohorts & Gender Demographics</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gender */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Gender Breakdown</span>
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                    <span>Male: {census.demographics.gender.male} ({census.demographics.gender.malePercentage}%)</span>
                    <span>Female: {census.demographics.gender.female} ({census.demographics.gender.femalePercentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3 flex">
                    <div className="bg-blue-600 h-full" style={{ width: `${census.demographics.gender.malePercentage}%` }} />
                    <div className="bg-rose-400 h-full" style={{ width: `${census.demographics.gender.femalePercentage}%` }} />
                  </div>
                </div>

                {/* Age cohorts */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Age Distribution</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                    <div>&lt; 65 yrs: <strong className="text-slate-900">{census.demographics.ageBrackets.under65}</strong></div>
                    <div>65 - 74 yrs: <strong className="text-slate-900">{census.demographics.ageBrackets.age65to74}</strong></div>
                    <div>75 - 84 yrs: <strong className="text-slate-900">{census.demographics.ageBrackets.age75to84}</strong></div>
                    <div>85+ yrs: <strong className="text-slate-900">{census.demographics.ageBrackets.age85plus}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Census Table (Matching Residents Table SC_017 style) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Facility Roster & Census ({census.residents.length} residents)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Resident ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Age / Gender</th>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Care Level</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Admission Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {census.residents.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">{r.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.name}</td>
                      <td className="py-3 px-4 text-slate-600">{r.age} yrs · {r.gender}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{r.room}</td>
                      <td className="py-3 px-4 text-slate-700">{r.careLevel}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          r.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          r.status === "PENDING" ? "bg-slate-100 text-slate-700 border border-slate-200" :
                          "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{r.admissionDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INCIDENTS & SAFETY */}
      {activeTab === "incidents" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Severity Breakdown</span>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-rose-700">HIGH (Chart Lock Trigger):</span>
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200 font-bold">{summary.incidents.bySeverity.HIGH || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-amber-700">MEDIUM (Clinical Review):</span>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200 font-bold">{summary.incidents.bySeverity.MEDIUM || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-700">LOW (Minor):</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-bold">{summary.incidents.bySeverity.LOW || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs md:col-span-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Incident Categories</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(summary.incidents.byType).map(([type, count]) => (
                  <div key={type} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{type.replaceAll("_", " ")}</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Incidents Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Incident Work Queue & Regulatory Log ({incidents.length} events)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Incident Type</th>
                    <th className="py-3 px-4">Resident & Room</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">SLA Deadline</th>
                    <th className="py-3 px-4">Reported By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {inc.type.replaceAll("_", " ")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{inc.resident.name}</span>
                        <span className="text-slate-500 text-[11px]">Room: {inc.resident.room}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          inc.severity === "HIGH" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          inc.severity === "MEDIUM" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full font-medium text-xs bg-blue-50 text-blue-700 border border-blue-200">
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={inc.description}>
                        {inc.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className={inc.isOverdue ? "text-rose-600 font-bold" : "text-slate-600"}>
                          {new Date(inc.slaDeadline).toLocaleDateString("en-US")}
                          {inc.isOverdue ? " (Overdue)" : ""}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{inc.reportedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CARE PLANS COMPLIANCE */}
      {activeTab === "carePlans" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed</span>
              <p className="text-3xl font-bold text-emerald-700 mt-2">{summary.carePlans.signed}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved</span>
              <p className="text-3xl font-bold text-blue-700 mt-2">{summary.carePlans.approved}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Review</span>
              <p className="text-3xl font-bold text-amber-700 mt-2">{summary.carePlans.pendingReview}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Draft</span>
              <p className="text-3xl font-bold text-slate-700 mt-2">{summary.carePlans.draft}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Overall Facility Care Plan Lifecycle Progress</h3>
            <p className="text-xs text-slate-500 mb-4">
              Total of {summary.carePlans.total} care plans stored in NHMS database.
            </p>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${Math.round(((summary.carePlans.signed + summary.carePlans.approved) / summary.carePlans.total) * 100)}%` }}
                title="Signed / Approved"
              />
              <div
                className="bg-amber-400 h-full"
                style={{ width: `${Math.round((summary.carePlans.pendingReview / summary.carePlans.total) * 100)}%` }}
                title="Pending Review"
              />
              <div
                className="bg-slate-300 h-full"
                style={{ width: `${Math.round((summary.carePlans.draft / summary.carePlans.total) * 100)}%` }}
                title="Draft"
              />
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Signed & Approved</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Awaiting DON Review</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Draft in Progress</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: eMAR ADHERENCE */}
      {activeTab === "medications" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Prescriptions</span>
              <p className="text-3xl font-bold text-slate-900 mt-2">{summary.medications.totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Adherence Rate</span>
              <p className="text-3xl font-bold text-blue-600 mt-2">{summary.medications.adherenceRate}%</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doses Administered</span>
              <p className="text-3xl font-bold text-emerald-700 mt-2">{summary.medications.dosesGiven}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missed / Refused</span>
              <p className="text-3xl font-bold text-rose-700 mt-2">{summary.medications.dosesMissed + summary.medications.dosesRefused}</p>
            </div>
          </div>

          {/* Med Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent Medication Administration Audit Log ({medLogs.length} events)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Medication & Dose</th>
                    <th className="py-3 px-4">Resident & Room</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Clinical Justification</th>
                    <th className="py-3 px-4">Administered By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(log.loggedAt).toLocaleString("en-US")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{log.drugName}</span>
                        <span className="text-[11px] text-slate-500">{log.dosage} · {log.route}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{log.residentName}</span>
                        <span className="text-[11px] text-slate-500">Room: {log.room}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-medium text-xs ${
                          log.status === "GIVEN" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          log.status === "MISSED" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {log.status === "GIVEN" ? "Given" : log.status === "MISSED" ? "Missed" : log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.overrideReason || "Routine administration"}>
                        {log.overrideReason || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{log.administeredBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
