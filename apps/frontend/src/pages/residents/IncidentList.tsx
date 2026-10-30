import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { incidentsService } from "../../services/incidents";
import { EmptyState, LoadingState, Notice, Panel, PrimaryButton, StatusBadge, WorkflowPage } from "../../components/workflow/WorkflowUi";

const formatRemaining = (minutes: number) => {
    if (minutes < 0) return "OVERDUE";
    if (minutes < 60) return `${minutes}m left`;
    return `${Math.ceil(minutes / 60)}h left`;
};
const severityTone = (name: string) =>
    name.toLowerCase().includes("critical") ? "danger" : name.toLowerCase().includes("major") ? "warning" : name.toLowerCase().includes("moderate") ? "warning" : "neutral";

export default function IncidentList() {
    const navigate = useNavigate();
    const query = useQuery({ queryKey: ["incidents"], queryFn: incidentsService.getIncidents, refetchInterval: 60_000 });
    const [status, setStatus] = useState("ALL");
    const [search, setSearch] = useState("");

    const allIncidents = query.data ?? [];
    const totalCount = allIncidents.length;
    const activeCount = allIncidents.filter((i: any) => i.status === "OPEN" || i.status === "UNDER_INVESTIGATION" || i.status === "PENDING_REVIEW").length;
    const criticalCount = allIncidents.filter((i: any) => i.isSlaOverdue || i.severity?.name?.toLowerCase().includes("critical") || i.severity?.name?.toLowerCase().includes("major")).length;
    const resolvedCount = allIncidents.filter((i: any) => i.status === "RESOLVED").length;

    const rows = useMemo(
        () =>
            allIncidents.filter(
                (incident: any) =>
                    (status === "ALL" || incident.status === status) &&
                    (!search.trim() ||
                        incident.resident.fullName.toLowerCase().includes(search.toLowerCase()) ||
                        incident.incidentType.toLowerCase().includes(search.toLowerCase())),
            ),
        [allIncidents, status, search],
    );

    return (
        <WorkflowPage
            breadcrumb="Incident & Risk"
            title="Incident List"
            description="Monitor active and historical incidents, chart status, and regulatory reporting deadlines."
            actions={<PrimaryButton onClick={() => navigate("/incidents/report")}>+ Report Incident</PrimaryButton>}
        >
            {query.error && (
                <div className="mb-4">
                    <Notice type="error">{String(query.error)}</Notice>
                </div>
            )}

            {/* Top Summary Cards (SC_017 consistent style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                        ⚠️
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Total Incidents</p>
                        <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                        ⏳
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Active / In Progress</p>
                        <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
                        🚨
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Critical / Overdue</p>
                        <p className="text-2xl font-bold text-slate-900">{criticalCount}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                        ✓
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Resolved</p>
                        <p className="text-2xl font-bold text-slate-900">{resolvedCount}</p>
                    </div>
                </div>
            </div>

            <Panel
                title="Incident Work Queue"
                actions={
                    <div className="flex flex-wrap gap-2">
                        <input
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search resident or type"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" value={status} onChange={(event) => setStatus(event.target.value)}>
                            <option value="ALL">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="UNDER_INVESTIGATION">Under Investigation</option>
                            <option value="PENDING_REVIEW">Pending Review</option>
                            <option value="RESOLVED">Resolved</option>
                        </select>
                    </div>
                }
            >
                {query.isLoading ? (
                    <LoadingState />
                ) : !rows.length ? (
                    <EmptyState label="No incidents match the current filters." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3.5">Resident</th>
                                    <th className="px-4 py-3.5">Type</th>
                                    <th className="px-4 py-3.5">Severity</th>
                                    <th className="px-4 py-3.5">Reported</th>
                                    <th className="px-4 py-3.5">SLA Countdown</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-4 py-3.5">Chart</th>
                                    <th className="px-4 py-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((incident: any) => {
                                    const initials = incident.resident?.fullName
                                        ? incident.resident.fullName
                                              .split(" ")
                                              .filter(Boolean)
                                              .map((n: string) => n[0])
                                              .join("")
                                              .slice(0, 2)
                                              .toUpperCase()
                                        : "RE";

                                    return (
                                        <tr key={incident.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200 shrink-0">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-slate-900 block">{incident.resident.fullName}</span>
                                                        <span className="text-xs font-normal text-slate-500">Room {incident.resident.roomNumber ?? "—"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-slate-800">{incident.incidentType}</td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge tone={severityTone(incident.severity.name) as any}>{incident.severity.name}</StatusBadge>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-600 text-xs">{new Date(incident.reportedAt).toLocaleString()}</td>
                                            <td
                                                className={`px-4 py-3.5 font-bold ${incident.isSlaOverdue ? "text-red-600" : incident.slaRemainingMinutes <= 24 * 60 ? "text-amber-700" : "text-emerald-700"}`}
                                            >
                                                {formatRemaining(incident.slaRemainingMinutes)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge tone={incident.status === "RESOLVED" ? "success" : "info"}>{incident.status.replaceAll("_", " ")}</StatusBadge>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge tone={incident.resident.isChartLocked ? "danger" : "success"}>
                                                    {incident.resident.isChartLocked ? "Locked" : "Unlocked"}
                                                </StatusBadge>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <button 
                                                    className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors" 
                                                    onClick={() => navigate(`/incidents/${incident.id}`)}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </WorkflowPage>
    );
}
