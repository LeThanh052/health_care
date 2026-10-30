import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../../constants/appRoutes";
import type { CarePlan } from "../types";
import { CarePlanStatusBadge } from "./carePlanStatusBadge";

type CarePlanTableProps = {
  carePlans: CarePlan[];
  isLoading: boolean;
  page: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function CarePlanTable({ carePlans, isLoading, page, total, onPageChange }: CarePlanTableProps) {
  const totalPages = Math.ceil(total / 5);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-2xs">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
        <p className="text-sm font-medium">Loading care plans...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Resident</th>
              <th className="px-6 py-3.5">Care Level</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Last Review</th>
              <th className="px-6 py-3.5">Next Review</th>
              <th className="px-6 py-3.5">Assigned Staff</th>
              <th className="px-6 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {carePlans.map((cp) => {
              const initials = cp.residentName
                ? cp.residentName
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "RE";

              return (
                <tr key={cp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200 shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{cp.residentName}</div>
                        <div className="text-xs text-slate-500">{cp.room ? `Room ${cp.room}` : "Unassigned"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{cp.locTier || "—"}</td>
                  <td className="px-6 py-4">
                    <CarePlanStatusBadge status={cp.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {cp.lastReview || "—"}
                  </td>
                  <td className="px-6 py-4 font-medium text-xs">
                    {cp.nextReview === "overdue" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Overdue
                      </span>
                    ) : (
                      <span className="text-slate-600">{cp.nextReview || "—"}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700 text-xs">{cp.assigned}</td>
                  <td className="px-6 py-4">
                    <div className="table-actions">
                      <Link to={`${APP_ROUTES.CARE_PLANS}/${cp.id}`}>View</Link>
                      <Link to={`${APP_ROUTES.CARE_PLANS}/${cp.id}/edit`}>Edit</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {carePlans.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic">No care plans found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3.5">
          <span className="text-xs text-slate-500">
            Showing {(page - 1) * 5 + 1} to {Math.min(page * 5, total)} of {total} results
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button 
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
