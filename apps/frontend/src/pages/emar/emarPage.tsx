import React, { useEffect, useState } from "react";
import { 
  Pill, 
  Search, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  FileText,
  User,
  Activity,
  RefreshCw
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

  // Search filter inside medication list
  const [medSearch, setMedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "administered" | "missed">("all");

  // Administer Modal State
  const [administerModalMed, setAdministerModalMed] = useState<MedicationScheduleItem | null>(null);
  const [administerStatus, setAdministerStatus] = useState<"GIVEN" | "MISSED" | "REFUSED">("GIVEN");
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // New Order Modal State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newDrugName, setNewDrugName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newRoute, setNewRoute] = useState("PO (Oral)");
  const [newFrequency, setNewFrequency] = useState("Once daily (08:00)");
  const [newTimes, setNewTimes] = useState("08:00");
  const [newIsControlled, setNewIsControlled] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // 1. Fetch Residents on mount
  useEffect(() => {
    let active = true;
    setIsLoadingList(true);
    emarService
      .getResidents()
      .then((data) => {
        if (!active) return;
        setResidents(data);
        if (data.length > 0) {
          // Default to first active resident with medications, or first resident
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

  // 2. Fetch Resident Profile & Medications when selected
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

  // Handle Administer Submit
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
        message: `Đã ghi nhận thành công "${administerStatus}" cho thuốc ${administerModalMed.name}. Dữ liệu đã lưu vào database!`,
      });

      setAdministerModalMed(null);
      setOverrideReason("");
      setAdministerStatus("GIVEN");

      // Reload medications
      fetchMedications(selectedResidentId);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Không thể ghi nhận phát thuốc.",
      });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Handle New Order Submit
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
        message: `Đã kê đơn thành công "${newDrugName}" (${newDosage}) cho cư dân. Y lệnh đã lưu vào database!`,
      });

      setIsNewOrderModalOpen(false);
      setNewDrugName("");
      setNewDosage("");
      setNewTimes("08:00");
      setNewIsControlled(false);

      // Reload
      fetchMedications(selectedResidentId);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Không thể tạo y lệnh thuốc.",
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

  const givenCount = (profile?.medications || []).filter((m) => m.currentStatus === "administered").length;
  const dueCount = (profile?.medications || []).filter((m) => m.currentStatus === "pending").length;
  const missedCount = (profile?.medications || []).filter((m) => m.currentStatus === "missed" || m.currentStatus === "refused").length;

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 min-h-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>eMAR</span>
            <span>&gt;</span>
            <span>Electronic Medication Administration Record</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hồ sơ Cấp phát Thuốc Điện tử (eMAR)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi, đối chiếu và ghi nhận y lệnh thuốc trực tiếp vào cơ sở dữ liệu y tế NHMS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchMedications(selectedResidentId)}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition-colors"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingProfile ? "animate-spin text-teal-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Kê y lệnh thuốc mới</span>
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

      {/* Resident Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-100 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 max-w-md">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Chọn Cư dân đang điều trị:
            </label>
            <select
              value={selectedResidentId}
              onChange={(e) => setSelectedResidentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · Phòng {r.room} · {r.code} ({r.activeMedicationsCount} thuốc)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Medication Counters */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="px-3 py-1 text-center border-r border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-500">Tổng thuốc</p>
            <p className="text-lg font-black text-slate-900">{profile?.medications.length ?? 0}</p>
          </div>
          <div className="px-3 py-1 text-center border-r border-slate-200">
            <p className="text-[10px] uppercase font-bold text-emerald-600">Đã uống</p>
            <p className="text-lg font-black text-emerald-700">{givenCount}</p>
          </div>
          <div className="px-3 py-1 text-center border-r border-slate-200">
            <p className="text-[10px] uppercase font-bold text-amber-600">Đến giờ</p>
            <p className="text-lg font-black text-amber-700">{dueCount}</p>
          </div>
          <div className="px-3 py-1 text-center">
            <p className="text-[10px] uppercase font-bold text-rose-600">Bỏ lỡ</p>
            <p className="text-lg font-black text-rose-700">{missedCount}</p>
          </div>
        </div>
      </div>

      {/* Patient Banner */}
      {isLoadingProfile ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
          <LoadingState />
        </div>
      ) : profile ? (
        <PatientBanner resident={profile.resident} />
      ) : null}

      {/* Medication Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm thuốc, liều lượng..."
            value={medSearch}
            onChange={(e) => setMedSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(["all", "pending", "administered", "missed"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                statusFilter === st
                  ? "bg-teal-600 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {st === "all" ? "Tất cả" : st === "pending" ? "Đến giờ (Due)" : st === "administered" ? "Đã uống (Given)" : "Bỏ lỡ (Missed)"}
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
                <h3 className="text-base font-extrabold text-slate-900">Ghi nhận Phát thuốc</h3>
                <p className="text-xs text-slate-500 mt-0.5">Xác nhận việc cấp phát y lệnh thuốc cho cư dân</p>
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
              <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl space-y-1">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Thông tin y lệnh</span>
                <p className="text-sm font-black text-slate-900">{administerModalMed.name} ({administerModalMed.dosage})</p>
                <p className="text-xs text-slate-600">Đường dùng: {administerModalMed.route} · Tần suất: {administerModalMed.frequency}</p>
                <p className="text-xs text-slate-500">Cư dân: <strong className="text-slate-800">{profile?.resident.name}</strong> (Phòng {profile?.resident.room})</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Kết quả phát thuốc:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "GIVEN", label: "Đã uống (Given)", color: "border-emerald-500 bg-emerald-50 text-emerald-800" },
                    { id: "MISSED", label: "Bỏ lỡ (Missed)", color: "border-rose-500 bg-rose-50 text-rose-800" },
                    { id: "REFUSED", label: "Từ chối (Refused)", color: "border-slate-500 bg-slate-100 text-slate-800" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAdministerStatus(opt.id as any)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-all ${
                        administerStatus === opt.id ? opt.color + " ring-2 ring-teal-500" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ghi chú lâm sàng / Lý do (nếu bỏ lỡ hoặc từ chối):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú điều dưỡng, tình trạng cư dân khi uống thuốc..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdministerModalMed(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdmin}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingAdmin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Xác nhận & Lưu Database</span>
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
                <h3 className="text-base font-extrabold text-slate-900">Kê y lệnh thuốc mới</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tạo chỉ định dùng thuốc cho cư dân <strong className="text-slate-800">{profile?.resident.name}</strong>
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tên thuốc (Biệt dược / Hoạt chất):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Amlodipine, Metformin, Paracetamol..."
                    value={newDrugName}
                    onChange={(e) => setNewDrugName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Liều lượng (Dosage):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 5mg, 500mg, 1 viên..."
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Đường dùng (Route):</label>
                  <select
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  >
                    <option>PO (Oral - Đường uống)</option>
                    <option>IV (Intravenous - Tiêm tĩnh mạch)</option>
                    <option>IM (Intramuscular - Tiêm bắp)</option>
                    <option>SubQ (Tiêm dưới da)</option>
                    <option>Topical (Bôi ngoài da)</option>
                    <option>Inhalation (Khí dung)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tần suất & Hướng dẫn:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Ngày 1 lần buổi sáng sau ăn..."
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Khung giờ phát thuốc (cách nhau dấu phẩy):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 08:00, 20:00"
                    value={newTimes}
                    onChange={(e) => setNewTimes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="controlledSubstance"
                    checked={newIsControlled}
                    onChange={(e) => setNewIsControlled(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                  <label htmlFor="controlledSubstance" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Thuộc danh mục thuốc kiểm soát đặc biệt (Controlled Substance)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingOrder ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Lưu Y lệnh vào Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
