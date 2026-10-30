import React from "react";
import { Pill, Clock, CheckCircle2, XCircle, AlertCircle, ShieldAlert } from "lucide-react";
import type { MedicationScheduleItem } from "../../../services/emar";

interface MedicationTableProps {
  medications: MedicationScheduleItem[];
  onAdminister: (med: MedicationScheduleItem) => void;
  isChartLocked?: boolean;
}

export const MedicationTable: React.FC<MedicationTableProps> = ({ medications, onAdminister, isChartLocked }) => {
  const getStatusBadge = (status: MedicationScheduleItem["currentStatus"]) => {
    switch (status) {
      case "administered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã uống / Given
          </span>
        );
      case "missed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Bỏ lỡ / Missed
          </span>
        );
      case "refused":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5" /> Từ chối / Refused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Đến giờ / Due
          </span>
        );
    }
  };

  if (medications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Không có y lệnh thuốc đang hiệu lực</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Cư dân này hiện chưa có chỉ định dùng thuốc trong đợt điều trị hiện tại hoặc đã ngưng y lệnh.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-5">Thuốc & Liều lượng</th>
              <th className="py-3.5 px-4">Đường dùng & Tần suất</th>
              <th className="py-3.5 px-4">Lịch phát trong ngày</th>
              <th className="py-3.5 px-4">Bác sĩ kê đơn</th>
              <th className="py-3.5 px-4">Trạng thái hiện tại</th>
              <th className="py-3.5 px-5 text-right">Thao tác điều dưỡng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {medications.map((med) => {
              const latestLog = med.logs[0];

              return (
                <tr key={med.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm leading-tight">{med.name}</span>
                          {med.isControlledSubstance && (
                            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-200">
                              Thuốc kiểm soát đặc biệt
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-600 block mt-0.5">
                          Liều lượng: <span className="text-slate-900 font-bold">{med.dosage}</span>
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800 block">{med.route}</span>
                      <span className="text-slate-500 mt-0.5 block">{med.frequency}</span>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {med.schedule.map((time, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-md border border-slate-200"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                    {latestLog && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Gần nhất: {new Date(latestLog.loggedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} bởi {latestLog.administeredBy}
                      </p>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    <span className="text-xs font-medium text-slate-700">{med.prescribedBy}</span>
                  </td>

                  <td className="py-4 px-4">
                    {getStatusBadge(med.currentStatus)}
                  </td>

                  <td className="py-4 px-5 text-right">
                    <button
                      type="button"
                      disabled={isChartLocked}
                      onClick={() => onAdminister(med)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg shadow-2xs transition-colors ${
                        isChartLocked
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ghi nhận / Administer</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
