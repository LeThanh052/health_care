import React, { useEffect, useState } from "react";
import { 
  Pill, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  User, 
  RefreshCw,
  XCircle
} from "lucide-react";
import { PatientBanner } from "./components/patientBanner";
import { MedicationTable } from "./components/medicationTable";
import { emarService, type EmarResidentItem, type EmarResidentProfile, type MedicationScheduleItem } from "../../services/emar";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";

export const EmarPage: React.FC = () => {
  const [residents, setResidents] = useState<EmarResidentItem[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  const [profile, setProfile] = useState<EmarResidentProfile | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter
  const [medSearch, setMedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "administered" | "missed">("all");

  // Administer Modal
  const [administerModalMed, setAdministerModalMed] = useState<MedicationScheduleItem | null>(null);
  const [administerStatus, setAdministerStatus] = useState<"GIVEN" | "MISSED" | "REFUSED">("GIVEN");
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // New Order Modal
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newDrugName, setNewDrugName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newRoute, setNewRoute] = useState("PO (Oral)");
  const [newFrequency, setNewFrequency] = useState("Once daily (08:00)");
  const [newTimes, setNewTimes] = useState("08:00");
  const [newIsControlled, setNewIsControlled] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoadingList(true);
    emarService
      .getResidents()
      .then((data) => {
        if (!active) return;
        setResidents(data);
        if (data.length > 0) {
          const defaultResident = data.find((r) => r.activeMedicationsCount > 0) || data[0];
          setSelectedResidentId(defaultResident.id);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load residents");
      })
      .finally(() => {
        if (active) setIsLoadingList(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const fetchMedications = (resId: string) => {
    if (!resId) return;
    setIsLoadingProfile(true);
    emarService
      .getResidentMedications(resId)
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load resident medications");
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  };

  useEffect(() => {
    if (selectedResidentId) {
      fetchMedications(selectedResidentId);
    }
  }, [selectedResidentId]);

  const handleAdministerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!administerModalMed) return;

    setIsSubmittingAdmin(true);
    try {
      await emarService.administer({
        orderId: administerModalMed.id,
        status: administerStatus,
        overrideReason: overrideReason.trim() || undefined,
      });

      setFeedback({
        type: "success",
        message: `Successfully recorded ${administerStatus} for ${administerModalMed.name}. Saved to database.`,
      });

      setAdministerModalMed(null);
      setOverrideReason("");
      setAdministerStatus("GIVEN");
      fetchMedications(selectedResidentId);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Unable to record medication administration.",
      });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrugName || !newDosage || !selectedResidentId) return;

    setIsSubmittingOrder(true);
    try {
      const timesArr = newTimes
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await emarService.createOrder({
        residentId: selectedResidentId,
        drugName: newDrugName,
        dosage: newDosage,
        route: newRoute,
        frequency: newFrequency,
        scheduleTimes: timesArr.length > 0 ? timesArr : ["08:00"],
        isControlledSubstance: newIsControlled,
      });

      setFeedback({
        type: "success",
        message: `Order for ${newDrugName} (${newDosage}) created successfully and stored in database.`,
      });

      setIsNewOrderModalOpen(false);
      setNewDrugName("");
      setNewDosage("");
      setNewTimes("08:00");
      setNewIsControlled(false);
      fetchMedications(selectedResidentId);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to create medication order.",
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (isLoadingList) return <LoadingState />;
  if (error && !profile) return <ErrorState onRetry={() => window.location.reload()} />;

  const filteredMeds = (profile?.medications || []).filter((med) => {
    const matchesSearch = med.name.toLowerCase().includes(medSearch.toLowerCase()) ||
                          med.dosage.toLowerCase().includes(medSearch.toLowerCase());
    const matchesStatus = statusFilter === "all" ? true : med.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrders = profile?.medications.length ?? 0;
  const givenCount = (profile?.medications || []).filter((m) => m.currentStatus === "administered").length;
  const dueCount = (profile?.medications || []).filter((m) => m.currentStatus === "pending").length;
  const missedCount = (profile?.medications || []).filter((m) => m.currentStatus === "missed" || m.currentStatus === "refused").length;

  return (
    <main className="p-6 md:p-8 space-y-6 bg-slate-50 min-h-full">
      {/* Page Header (Resident-matching style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>eMAR</span>
            <span>&gt;</span>
            <span>Medication Administration Record</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">eMAR Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Verify 5 rights, review scheduled orders, and record bedside administration directly to database
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchMedications(selectedResidentId)}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingProfile ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Medication Order</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards (Matching Residents List SC_017 design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Orders</p>
            <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Administered (Given)</p>
            <p className="text-2xl font-bold text-slate-900">{givenCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Due for Round</p>
            <p className="text-2xl font-bold text-slate-900">{dueCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Missed / Refused</p>
            <p className="text-2xl font-bold text-slate-900">{missedCount}</p>
          </div>
        </div>
      </div>

      {/* Resident Selector Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 max-w-md">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Select Resident:
            </label>
            <select
              value={selectedResidentId}
              onChange={(e) => setSelectedResidentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · Room {r.room} · {r.code} ({r.activeMedicationsCount} orders)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Patient Banner */}
      {isLoadingProfile ? (
        <div className="bg-white rounded-xl p-8 border border-slate-200 text-center shadow-2xs">
          <LoadingState />
        </div>
      ) : profile ? (
        <PatientBanner resident={profile.resident} />
      ) : null}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medications by name, dosage..."
            value={medSearch}
            onChange={(e) => setMedSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(["all", "pending", "administered", "missed"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {st === "all" ? "All Orders" : st === "pending" ? "Due" : st === "administered" ? "Given" : "Missed"}
            </button>
          ))}
        </div>
      </div>

      {/* Medication Table */}
      <MedicationTable
        medications={filteredMeds}
        onAdminister={(med) => setAdministerModalMed(med)}
        isChartLocked={profile?.resident.isChartLocked}
      />

      {/* Administer Medication Modal */}
      {administerModalMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Record Administration</h3>
                <p className="text-xs text-slate-500 mt-0.5">Confirm medication intake for resident</p>
              </div>
              <button
                type="button"
                onClick={() => setAdministerModalMed(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdministerSubmit} className="p-5 space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Order Verification</span>
                <p className="text-sm font-bold text-slate-900">{administerModalMed.name} ({administerModalMed.dosage})</p>
                <p className="text-xs text-slate-600">Route: {administerModalMed.route} · Frequency: {administerModalMed.frequency}</p>
                <p className="text-xs text-slate-500">Resident: <strong className="text-slate-800">{profile?.resident.name}</strong> (Room {profile?.resident.room})</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Administration Result:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "GIVEN", label: "Given", color: "border-emerald-500 bg-emerald-50 text-emerald-800" },
                    { id: "MISSED", label: "Missed", color: "border-rose-500 bg-rose-50 text-rose-800" },
                    { id: "REFUSED", label: "Refused", color: "border-slate-500 bg-slate-100 text-slate-800" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAdministerStatus(opt.id as any)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-all ${
                        administerStatus === opt.id ? opt.color + " ring-2 ring-blue-500" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Clinical Notes / Reason (required if missed or refused):
                </label>
                <textarea
                  rows={2}
                  placeholder="Document clinical observation, tolerance, or refusal explanation..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdministerModalMed(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdmin}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingAdmin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Medication Order Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">New Medication Order</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prescribe medication for <strong className="text-slate-800">{profile?.resident.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Medication Name & Generic:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amlodipine, Lisinopril, Donepezil..."
                    value={newDrugName}
                    onChange={(e) => setNewDrugName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Dosage:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5mg, 10mg, 500mg..."
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Route:</label>
                  <select
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option>PO (Oral)</option>
                    <option>IV (Intravenous)</option>
                    <option>IM (Intramuscular)</option>
                    <option>SubQ (Subcutaneous)</option>
                    <option>Topical</option>
                    <option>Inhalation</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Frequency & Instructions:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Once daily in the morning with breakfast..."
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Schedule Times (comma separated):</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08:00, 20:00"
                    value={newTimes}
                    onChange={(e) => setNewTimes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="controlledSubstance"
                    checked={newIsControlled}
                    onChange={(e) => setNewIsControlled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <label htmlFor="controlledSubstance" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Controlled Substance Schedule II-IV
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingOrder ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Order to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
