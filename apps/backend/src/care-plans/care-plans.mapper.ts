export function mapResidentSummary(r: any) {
        if (!r) return null;
        return {
                ...r,
                firstName: r.first_name,
                lastName: r.last_name,
                isDeleted: r.is_deleted,
                createdAt: r.created_at,
                updatedAt: r.updated_at
        };
}

export function mapCarePlanSummary(p: any) {
        if (!p) return null;
        const room = p.residents?.beds?.rooms?.room_number
                ? `${p.residents.beds.rooms.room_number}${p.residents.beds.bed_number ? '-' + p.residents.beds.bed_number : ''}`
                : 'Unassigned';
        const locTier = p.residents?.resident_care_level_history?.[0]?.care_levels?.level_name ?? 'Tier 1 - Low';

        return {
                ...p,
                residentId: p.resident_id,
                createdBy: p.created_by,
                significantChangeFlag: p.significant_change_flag,
                isDeleted: p.is_deleted,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
                room,
                locTier,
                resident: {
                        ...mapResidentSummary(p.residents),
                        room,
                        locTier,
                },
                creator: p.users,
        };
}

export function mapCarePlanDetail(cp: any) {
        if (!cp) return null;
        return {
                ...mapCarePlanSummary(cp),
                goals: cp.care_goals || [],
                interventions: (cp.care_interventions || []).map((i: any) => ({
                        ...i,
                        assignedRole: i.assigned_role,
                        tasks: i.care_tasks || []
                })),
                reviews: (cp.care_plan_reviews || []).map((r: any) => ({ ...r, reviewer: r.users })),
                signatures: (cp.care_plan_signatures || []).map((s: any) => ({ ...s, signer: s.users })),
                idtAcks: (cp.idt_acknowledgments || []).map((a: any) => ({ ...a, user: a.users }))
        };
}
