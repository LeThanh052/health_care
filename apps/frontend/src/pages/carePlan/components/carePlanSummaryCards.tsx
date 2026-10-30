import { Layers, FileEdit, Clock, AlertTriangle } from "lucide-react";

export function CarePlanSummaryCards({
  total = 24,
  draftCount = 5,
  pendingCount = 3,
  reviewDueCount = 2,
}: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
          <Layers className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Total Plans</p>
          <p className="text-2xl font-bold text-slate-900">{total}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
          <Clock className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Pending Review</p>
          <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Review Due</p>
          <p className="text-2xl font-bold text-slate-900">{reviewDueCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg">
          <FileEdit className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Drafts</p>
          <p className="text-2xl font-bold text-slate-900">{draftCount}</p>
        </div>
      </div>
    </div>
  );
}
