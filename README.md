async function exportTasksToExcel(req, res) {
    try {
        const organizationid = req.data.orgId;
        const role = req.data.user_role;
        const statusFilter = req.data.status;
        const filters = req.data.filters || {};
        const completion_startDate = req.data.completion_startDate;
        const completion_endDate = req.data.completion_endDate;

        let params = [organizationid];
        let whereClauses = ["ta.organizationid = $1"];

        // ✅ Status filter (added ALL condition)
        if (!statusFilter || statusFilter.toLowerCase() === "all") {
            // No filter for status -> all tasks
        } else {
            const active_status_map = { ongoing: 0, complete: 1, overdue: 2 };
            const active_status = active_status_map[statusFilter.toLowerCase()];
            if (active_status !== undefined) {
                params.push(active_status);
                whereClauses.push(`ta.active_status = $${params.length}`);
            }
        }

        // ✅ Outside date range
        if (completion_startDate) {
            params.push(completion_startDate);
            whereClauses.push(`ta.completion_date >= $${params.length}`);
        }
        if (completion_endDate) {
            params.push(completion_endDate);
            whereClauses.push(`ta.completion_date <= $${params.length}`);
        }

        // ✅ Inside date range
        if (filters.completion_startDate) {
            params.push(filters.completion_startDate);
            whereClauses.push(`ta.completion_date >= $${params.length}`);
        }
        if (filters.completion_endDate) {
            params.push(filters.completion_endDate);
            whereClauses.push(`ta.completion_date <= $${params.length}`);
        }

        // ✅ Department
        if (filters.department_id?.length) {
            params.push(filters.department_id);
            whereClauses.push(`us1.deptid = ANY($${params.length})`);
        }

        // ✅ Assigned To
        if (filters.assigned_to?.length) {
            params.push(filters.assigned_to);
            whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
        }

        // ✅ Assigned By
        if (filters.assigned_by?.length) {
            params.push(filters.assigned_by);
            whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
        }

        // ✅ Task type
        if (filters.type) {
            params.push(filters.type.toLowerCase() === "normal" ? '0' : '1');
            whereClauses.push(`ta.task_type = $${params.length}`);
        }

        // ✅ Frequency (Recurring)
        if (filters.frequency) {
            params.push(filters.frequency);
            whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
        }

        const query = `
            SELECT 
                ta.title,
                ta.description,
                ta.completion_date,
                us1.name AS created_by,
                COALESCE(dept.department_name, 'Owner') AS department,
                json_agg(us.name) AS assigned_to,
                CASE
                    WHEN ta.active_status = 0 THEN 'ongoing'
                    WHEN ta.active_status = 1 THEN 'complete'
                    WHEN ta.active_status = 2 THEN 'overdue'
                END AS status
            FROM ${schema}.tasks ta
            INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
            LEFT JOIN ${schema}.departments dept ON us1.deptid = dept.row_id
            INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
            INNER JOIN ${schema}.users us ON us.row_id = assigned_to_id::text
            LEFT JOIN ${schema}.recurring_task rt ON ta.recurringid = rt.row_id
            WHERE ${whereClauses.join(" AND ")}
            GROUP BY ta.title, ta.description, ta.completion_date, us1.name, dept.department_name
            ORDER BY ta.cr_on DESC;
        `;

        // ✅ Role check
        if (role !== 1) {
            return { status: 1, msg: "You are not admin" };
        }

        const resp = await db_query.customQuery(query, "Tasks Fetched for Excel", params);
        return resp;

    } catch (err) {
        console.error("❌ Error fetching tasks for export:", err);
        return { status: 0, msg: "Error fetching tasks" };
    }
}
