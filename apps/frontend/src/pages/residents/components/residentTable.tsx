import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../../constants/appRoutes";
import { useAuthStore } from "../../../utils/session";
import { CARE_LEVEL_LABEL, GENDER_LABEL } from "../constants";
import { calculateAge } from "../services/residentRepository";
import type { Resident } from "../types";
import { ResidentStatusBadge } from "./residentStatusBadge";

type ResidentTableProps = {
    residents: Resident[];
    isLoading: boolean;
};

export function ResidentTable({ residents, isLoading }: ResidentTableProps) {
    const user = useAuthStore((state) => state.user);
    const roleName = (user?.roleName || "").toLowerCase();
    const canManageResidents = Boolean(roleName.includes("admission") || roleName.includes("admin"));

    if (isLoading) {
        return (
            <div className="empty-state">
                <strong>Loading residents...</strong>
                <span>Preparing the latest resident census.</span>
            </div>
        );
    }

    if (residents.length === 0) {
        return (
            <div className="empty-state">
                <strong>No residents found</strong>
                <span>Try adjusting the search text or filter criteria.</span>
            </div>
        );
    }

    return (
        <div className="table-card">
            <table>
                <thead>
                    <tr>
                        <th>Resident</th>
                        <th>Age / Gender</th>
                        <th>Room</th>
                        <th>Care Level</th>
                        <th>Assigned Team</th>
                        <th>Admission Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {residents.map((resident) => (
                        <tr key={resident.id}>
                            <td>
                                <div className="resident-cell">
                                    <div className="avatar" aria-hidden="true">
                                        {resident.fullName
                                            .split(" ")
                                            .map((name) => name[0])
                                            .slice(0, 2)
                                            .join("")}
                                    </div>
                                    <div>
                                        <strong>{resident.fullName}</strong>
                                        <span>{resident.residentCode}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                {calculateAge(resident.dateOfBirth)} / {GENDER_LABEL[resident.gender]}
                            </td>
                            <td>{resident.roomNumber ?? "Unassigned"}</td>
                            <td>{CARE_LEVEL_LABEL[resident.careLevel]}</td>
                            <td>
                                <div className="stacked-text">
                                    <strong>{resident.assignedNurse ?? "Pending nurse"}</strong>
                                    <span>{resident.assignedDoctor ?? "Pending physician"}</span>
                                </div>
                            </td>
                            <td>{resident.admissionDate}</td>
                            <td>
                                <ResidentStatusBadge status={resident.status} />
                            </td>
                            <td>
                                <div className="table-actions">
                                    <Link to={`${APP_ROUTES.RESIDENTS}/${resident.id}`}>View</Link>
                                    {canManageResidents ? (
                                        <Link to={`${APP_ROUTES.RESIDENTS}/${resident.id}/edit`}>Edit</Link>
                                    ) : (
                                        <span
                                            className="opacity-40 cursor-not-allowed select-none text-slate-400"
                                            title="Chỉ dành cho Admission Staff hoặc System Admin"
                                        >
                                            Edit
                                        </span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
