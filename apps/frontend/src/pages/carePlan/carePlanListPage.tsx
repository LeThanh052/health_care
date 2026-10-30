import { useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../constants/appRoutes";
import { CarePlanFilters } from "./components/carePlanFilters";
import { CarePlanSummaryCards } from "./components/carePlanSummaryCards";
import { CarePlanTable } from "./components/carePlanTable";
import { useCarePlans, useCarePlanSummary } from "./services/apiHooks";
import { SelectResidentModal } from "../../components/modals/SelectResidentModal";
import type { CarePlanStatus } from "./types";

export function CarePlanListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CarePlanStatus | "all">("all");
  const [page, setPage] = useState(1);

  const query = { search, status, page, pageSize: 5 };

  const { data: listData, isLoading } = useCarePlans(query);
  const { data: summaryData } = useCarePlanSummary();

  const carePlans = listData?.items || [];
  const total = listData?.total || 0;

  const summary = summaryData || {
    total: 0,
    draftCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    reviewDueCount: 0,
  };

  const [isSelectResidentOpen, setIsSelectResidentOpen] = useState(false);

  return (
    <main className="p-6 md:p-8 space-y-6 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Care Planning</span>
            <span>&gt;</span>
            <span>List</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Care Plans</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} plans across your assigned residents
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={APP_ROUTES.CREATE_CARE_PLAN}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors"
          >
            + New Care Plan
          </Link>
        </div>
      </div>

      <CarePlanSummaryCards
        total={summary.total}
        draftCount={summary.draftCount}
        pendingCount={summary.pendingCount}
        rejectedCount={summary.rejectedCount}
        reviewDueCount={summary.reviewDueCount}
      />

      <CarePlanFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={(val) => {
          setStatus(val as CarePlanStatus | "all");
          setPage(1);
        }}
      />

      <CarePlanTable
        carePlans={carePlans}
        isLoading={isLoading}
        page={page}
        total={total}
        onPageChange={setPage}
      />

      <SelectResidentModal
        isOpen={isSelectResidentOpen}
        onClose={() => setIsSelectResidentOpen(false)}
        residents={carePlans.map((p) => ({
          id: p.id,
          firstName: p.residentName ? p.residentName.split(' ')[0] : 'Resident',
          lastName: p.residentName ? p.residentName.split(' ').slice(1).join(' ') : 'Name',
          roomNumber: p.room,
          careLevelName: p.locTier,
          carePlanStatus: p.status,
        }))}
      />
    </main>
  );
}
