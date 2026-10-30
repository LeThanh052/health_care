import { Search, ChevronDown } from "lucide-react";

type CarePlanFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
};

export function CarePlanFilters({ search, onSearchChange, status, onStatusChange }: CarePlanFiltersProps) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col md:flex-row gap-4 items-center" aria-label="Care plan filters">
      <div className="relative flex-1 w-full">
        <label className="block text-xs font-bold text-slate-700 mb-1">Search care plans</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by resident name or assigned staff..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      <div className="w-full md:w-64">
        <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
        <div className="relative">
          <select 
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full appearance-none px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer pr-8"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="signed">Signed</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
