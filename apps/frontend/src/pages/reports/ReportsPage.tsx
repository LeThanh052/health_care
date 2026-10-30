import React, { useEffect, useState } from "react";
import {
  FileText,
  Printer,
  Users,
  ShieldAlert,
  ClipboardList,
  Pill,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  RefreshCw,
  HeartPulse,
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
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 min-h-full print:p-0 print:bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Reports</span>
            <span>&gt;</span>
            <span>Executive Analytics & Regulatory Compliance</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Báo cáo Quản trị & Thống kê Y tế
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Dữ liệu tổng hợp thời gian thực từ cơ sở dữ liệu NHMS (Cư dân, Kế hoạch chăm sóc, Sự cố & eMAR)
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={fetchAllReports}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Xuất bản / In Báo cáo</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Occupancy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ lấp đầy giường</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{summary.census.occupancyRate}%</p>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {summary.census.activeResidents} / {summary.census.totalBeds} giường đang sử dụng ({summary.census.availableBeds} giường trống)
          </p>
        </div>

        {/* KPI 2: Care Plans */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kế hoạch đã ký duyệt</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-700 mt-2">
            {summary.carePlans.signed + summary.carePlans.approved} / {summary.carePlans.total}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {summary.carePlans.pendingReview} đang chờ DON duyệt · {summary.carePlans.draft} bản thảo
          </p>
        </div>

        {/* KPI 3: Incidents & Chart Lock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sự cố y khoa & Hồ sơ khóa</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-700 mt-2">
            {summary.incidents.open} đang xử lý
          </p>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {summary.incidents.chartLockedCount} hồ sơ đang niêm phong (Chart Locked)
          </p>
        </div>

        {/* KPI 4: eMAR Adherence */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tuân thủ phát thuốc (eMAR)</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-teal-700 mt-2">{summary.medications.adherenceRate}%</p>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {summary.medications.dosesGiven} liều đã uống · {summary.medications.dosesMissed} bỏ lỡ
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 print:hidden">
        {[
          { id: "census", label: "Biến động & Nhân khẩu học Cư dân", icon: Users },
          { id: "incidents", label: "Báo cáo Sự cố & An toàn Y tế", icon: ShieldAlert },
          { id: "carePlans", label: "Tuân thủ Kế hoạch Chăm sóc", icon: ClipboardList },
          { id: "medications", label: "Theo dõi Dùng thuốc (eMAR)", icon: Pill },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200 border-b-2 border-b-blue-600"
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
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs lg:col-span-1">
              <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-blue-600" />
                <span>Phân bổ theo Cấp độ Chăm sóc (LOC)</span>
              </h3>
              <div className="space-y-3">
                {Object.entries(summary.census.careLevels).map(([level, count]) => {
                  const pct = summary.census.totalResidents > 0
                    ? Math.round((count / summary.census.totalResidents) * 100)
                    : 0;
                  return (
                    <div key={level}>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>{level}</span>
                        <span>{count} cư dân ({pct}%)</span>
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
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs lg:col-span-2">
              <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Cơ cấu Độ tuổi & Giới tính</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gender */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Giới tính</span>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-800">
                    <span>Nam: {census.demographics.gender.male} ({census.demographics.gender.malePercentage}%)</span>
                    <span>Nữ: {census.demographics.gender.female} ({census.demographics.gender.femalePercentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-3 flex">
                    <div className="bg-blue-500 h-full" style={{ width: `${census.demographics.gender.malePercentage}%` }} />
                    <div className="bg-rose-400 h-full" style={{ width: `${census.demographics.gender.femalePercentage}%` }} />
                  </div>
                </div>

                {/* Age cohorts */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Nhóm tuổi</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                    <div>&lt; 65 tuổi: <strong className="text-slate-900">{census.demographics.ageBrackets.under65}</strong></div>
                    <div>65 - 74 tuổi: <strong className="text-slate-900">{census.demographics.ageBrackets.age65to74}</strong></div>
                    <div>75 - 84 tuổi: <strong className="text-slate-900">{census.demographics.ageBrackets.age75to84}</strong></div>
                    <div>85+ tuổi: <strong className="text-slate-900">{census.demographics.ageBrackets.age85plus}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Census Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Danh bạ Lưu trú Toàn viện ({census.residents.length} cư dân)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Mã cư dân</th>
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-4">Tuổi / Giới tính</th>
                    <th className="py-3 px-4">Phòng</th>
                    <th className="py-3 px-4">Mức độ chăm sóc</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Ngày tiếp nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {census.residents.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{r.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.name}</td>
                      <td className="py-3 px-4 text-slate-600">{r.age} tuổi · {r.gender}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{r.room}</td>
                      <td className="py-3 px-4 text-blue-700 font-medium">{r.careLevel}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          r.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          r.status === "PENDING" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-slate-100 text-slate-600"
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
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Phân loại Mức độ</span>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-rose-700">HIGH (Nguy kịch / Khóa bệnh án):</span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded">{summary.incidents.bySeverity.HIGH || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-amber-700">MEDIUM (Cần theo dõi):</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded">{summary.incidents.bySeverity.MEDIUM || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700">LOW (Nhẹ):</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded">{summary.incidents.bySeverity.LOW || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs md:col-span-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Danh mục Sự cố</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(summary.incidents.byType).map(([type, count]) => (
                  <div key={type} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">{type.replaceAll("_", " ")}</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Incidents Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Sổ Nhật ký Sự cố Y khoa ({incidents.length} sự cố)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Loại sự cố</th>
                    <th className="py-3 px-4">Cư dân & Phòng</th>
                    <th className="py-3 px-4">Mức độ</th>
                    <th className="py-3 px-4">Tiến độ xử lý</th>
                    <th className="py-3 px-4">Mô tả sự việc</th>
                    <th className="py-3 px-4">Hạn SLA</th>
                    <th className="py-3 px-4">Người báo cáo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {inc.type.replaceAll("_", " ")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{inc.resident.name}</span>
                        <span className="text-slate-500 text-[11px]">Phòng: {inc.resident.room}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          inc.severity === "HIGH" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                          inc.severity === "MEDIUM" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-blue-50 text-blue-700 border border-blue-200">
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={inc.description}>
                        {inc.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className={inc.isOverdue ? "text-rose-600 font-bold" : "text-slate-600"}>
                          {new Date(inc.slaDeadline).toLocaleDateString("vi-VN")}
                          {inc.isOverdue ? " (Quá hạn)" : ""}
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
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã Ký Duyệt (Signed)</span>
              <p className="text-3xl font-black text-emerald-700 mt-2">{summary.carePlans.signed}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã Chấp thuận (Approved)</span>
              <p className="text-3xl font-black text-blue-700 mt-2">{summary.carePlans.approved}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chờ DON duyệt</span>
              <p className="text-3xl font-black text-amber-700 mt-2">{summary.carePlans.pendingReview}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bản thảo (Draft)</span>
              <p className="text-3xl font-black text-slate-700 mt-2">{summary.carePlans.draft}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-black text-slate-900 mb-2">Tỷ lệ Hoàn tất Kế hoạch Chăm sóc Toàn viện</h3>
            <p className="text-xs text-slate-500 mb-4">
              Tổng cộng {summary.carePlans.total} kế hoạch đang lưu trữ trong cơ sở dữ liệu NHMS.
            </p>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${Math.round(((summary.carePlans.signed + summary.carePlans.approved) / summary.carePlans.total) * 100)}%` }}
                title="Đã ký / Duyệt"
              />
              <div
                className="bg-amber-400 h-full"
                style={{ width: `${Math.round((summary.carePlans.pendingReview / summary.carePlans.total) * 100)}%` }}
                title="Chờ duyệt"
              />
              <div
                className="bg-slate-300 h-full"
                style={{ width: `${Math.round((summary.carePlans.draft / summary.carePlans.total) * 100)}%` }}
                title="Bản thảo"
              />
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đã ký & duyệt</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Chờ DON phê duyệt</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Bản thảo (Draft)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: eMAR ADHERENCE */}
      {activeTab === "medications" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng y lệnh đang chạy</span>
              <p className="text-3xl font-black text-slate-900 mt-2">{summary.medications.totalOrders}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ Tuân thủ</span>
              <p className="text-3xl font-black text-teal-700 mt-2">{summary.medications.adherenceRate}%</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số lượt Đã uống</span>
              <p className="text-3xl font-black text-emerald-700 mt-2">{summary.medications.dosesGiven}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số lượt Bỏ lỡ / Từ chối</span>
              <p className="text-3xl font-black text-rose-700 mt-2">{summary.medications.dosesMissed + summary.medications.dosesRefused}</p>
            </div>
          </div>

          {/* Med Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Nhật ký Ghi nhận Cấp phát Thuốc Gần nhất ({medLogs.length} sự kiện)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Tên thuốc & Liều</th>
                    <th className="py-3 px-4">Cư dân & Phòng</th>
                    <th className="py-3 px-4">Kết quả</th>
                    <th className="py-3 px-4">Lý do / Ghi chú</th>
                    <th className="py-3 px-4">Điều dưỡng thực hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(log.loggedAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{log.drugName}</span>
                        <span className="text-[11px] text-slate-500">{log.dosage} · {log.route}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{log.residentName}</span>
                        <span className="text-[11px] text-slate-500">Phòng: {log.room}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          log.status === "GIVEN" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          log.status === "MISSED" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {log.status === "GIVEN" ? "Đã uống (Given)" : log.status === "MISSED" ? "Bỏ lỡ (Missed)" : log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.overrideReason || "Không có ghi chú"}>
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
    </div>
  );
};
