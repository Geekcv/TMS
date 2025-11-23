async function fetchTasks(req, res) {
  // console.log("req",req)
  try {
    //  Read data from request
    const userid = req.data.userId;
    const organizationid = req.data.orgId;
    const role = req.data.user_role; // 0 = normal, 1 = admin
    const statusFilter = req.data.status; // ongoing, complete, overdue
    const filters = req.data.filters || {}; // optional filters object
    const userDeptId = req.data.depId;

    const completion_startDate = req.data.completion_startDate;
    const completion_endDate = req.data.completion_endDate;
    const task_completed_on_startDate = req.data.task_completed_on_startDate;
    const task_completed_on_endDate = req.data.task_completed_on_endDate;

    //  Pagination
    const limit = req.data.limit || 100;
    const page = req.data.page || 1;
    const offset = (page - 1) * limit;

    // Base query
    let params = [organizationid];
    let whereClauses = ["ta.organizationid = $1"];

    // show only ongoing tasks IF user did not send status filtert ,  If no status selected → Show ongoing tasks.
    if (!statusFilter) {
      whereClauses.push("ta.active_status = 0");
    }

    //  Status filter (ongoing / complete / overdue)
    let active_status;
    if (statusFilter) {
      const active_status_map = { ongoing: 0, complete: 1, overdue: 2 };
      active_status = active_status_map[statusFilter.toLowerCase()];
      if (active_status !== undefined) {
        params.push(active_status);
        whereClauses.push(`ta.active_status = $${params.length}`);
      }
    }

    // Completion Date Filters (Outside)
    if (completion_startDate) {
      params.push(completion_startDate);
      whereClauses.push(`ta.completion_date >= $${params.length}`);
    }
    if (completion_endDate) {
      params.push(completion_endDate);
      whereClauses.push(`ta.completion_date <= $${params.length}`);
    }

    // Completion Date Filters (Inside filters object)
    if (filters.completion_startDate) {
      params.push(filters.completion_startDate);
      whereClauses.push(`ta.completion_date >= $${params.length}`);
    }
    if (filters.completion_endDate) {
      params.push(filters.completion_endDate);
      whereClauses.push(`ta.completion_date <= $${params.length}`);
    }

    // CompletedOn Date Filters — apply only for completed tasks
    if (active_status === 1 || statusFilter?.toLowerCase() === "complete") {
      if (filters.task_completed_on_startDate) {
        params.push(filters.task_completed_on_startDate);
        whereClauses.push(`ta.completedon >= $${params.length}`);
      }
      if (filters.task_completed_on_endDate) {
        params.push(filters.task_completed_on_endDate);
        whereClauses.push(`ta.completedon <= $${params.length}`);
      }
    }

    // Department Filter
    if (filters.department_id?.length) {
      params.push(filters.department_id);
      whereClauses.push(`us1.deptid = ANY($${params.length})`);
    }

    // Assigned To Filter
    if (filters.assigned_to?.length) {
      params.push(filters.assigned_to);
      whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
    }

    // Assigned By Filter
    if (filters.assigned_by?.length) {
      params.push(filters.assigned_by);
      whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
    }

    // Task Type (Normal / Recurring)
    if (filters.type) {
      params.push(filters.type.toLowerCase() === "normal" ? "0" : "1");
      whereClauses.push(`ta.task_type = $${params.length}`);
    }

    // Frequency Filter
    if (filters.frequency) {
      params.push(filters.frequency);
      whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
    }

    //  Department Admin Access Control
    if (role === 2) {
      params.push(userDeptId);
      whereClauses.push(`
                (
                    us1.deptid = $${params.length} 
                    OR assigned_to_id IN (
                        SELECT row_id FROM ${schema}.users WHERE deptid = $${params.length}
                    )
                )
            `);
    }

    //     if (filters.outgoing === true) {
    //    whereClauses.push(`
    //     us1.deptid IS NOT NULL
    //     AND us.deptid IS NOT NULL
    //     AND us1.deptid <> us.deptid
    //    `);
    // }

    if (filters.outgoing === true) {
      params.push(userDeptId);
      whereClauses.push(`
        us1.deptid = $${params.length}  
        AND us.deptid <> $${params.length}
    `);
    }

    if (filters.outgoing === false) {
      params.push(userDeptId);
      whereClauses.push(`
        NOT (
            us1.deptid = $${params.length} 
            AND us.deptid <> $${params.length}
        )
    `);
    }

    // Pagination
    params.push(limit);
    params.push(offset);

    //  Final Query with active user condition
    const query = `
            SELECT
                ta.row_id,
                ta.title,
                ta.description,
                ta.checklist,
                ta.completion_date,
                ta.completedon,
                us1.name AS created_by,
                CASE
                   WHEN dept.department_name IS NULL THEN
                       CASE us1.role
                          WHEN 3 THEN 'Top Management'
                          WHEN 1 THEN 'Admin'
                          ELSE 'Unknown'
                        END
                    ELSE dept.department_name
                  END AS created_by_department,
                ta.cr_on AS created_at,
                json_agg(us.name) AS assigned_to,
                json_agg(
    json_build_object(
        'user_id', us.row_id,
        'name', us.name,
        'department', 
            CASE 
                WHEN dept2.department_name IS NULL THEN 
                    CASE us.role
                        WHEN 3 THEN 'Top Management'
                        WHEN 1 THEN 'Admin'
                        ELSE 'Owner'
                    END
                ELSE dept2.department_name
            END
    )
) AS assigned_to_details,
                CASE
                    WHEN ta.active_status = 0 THEN 'ongoing'
                    WHEN ta.active_status = 1 THEN 'complete'
                    WHEN ta.active_status = 2 THEN 'overdue'
                END AS status,
                CASE
                    WHEN ta.task_type = '0' THEN 'Normal'
                    WHEN ta.task_type = '1' THEN 'Recurring'
                END AS task_type_title,
                CASE
                    WHEN ta.active_status = 1 AND ta.completion_date < CURRENT_DATE 
                        THEN ABS(ta.up_on::date - ta.completion_date) 
                    WHEN ta.completion_date >= CURRENT_DATE 
                        THEN (ta.completion_date - CURRENT_DATE)
                    ELSE ABS(ta.completion_date - CURRENT_DATE)
                END AS due_days,
                CASE
                    WHEN ta.completion_date >= CURRENT_DATE 
                        THEN 'due_in'
                    ELSE 'overdue_by'
                END AS due_label,
                us2.name AS updated_by,
                ta.task_type,
                rt.row_id as recurring_task_id,
                rt.schedule_details->>'type' AS schedule_type,
                rt.schedule_details->>'reminder_list' AS reminder_list
            FROM ${schema}.tasks ta
            INNER JOIN ${schema}.users us1 ON ta.assigned_by = us1.row_id
            LEFT JOIN ${schema}.departments dept ON us1.deptid = dept.row_id
            INNER JOIN LATERAL jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id ON TRUE
            INNER JOIN ${schema}.users us ON us.row_id = assigned_to_id::text
            LEFT JOIN ${schema}.departments dept2 ON us.deptid = dept2.row_id
            LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
            LEFT JOIN ${schema}.recurring_task rt ON ta.recurringid = rt.row_id
            WHERE ${whereClauses.join(" AND ")} 
              AND us.activestatus = 0
            GROUP BY ta.row_id, ta.checklist, us1.name, dept.department_name, us2.name, rt.schedule_details, rt.row_id,us1.role
            ORDER BY ta.cr_on DESC
            LIMIT $${params.length - 1} OFFSET $${params.length};
        `;
    // console.log("role",role)

    if (role === 1 || role === 3 || role === 2) {
      const resp = await db_query.customQuery(query, "Tasks Fetched", params);
      // console.log("response---->",resp.data)
      libFunc.sendResponse(res, resp);
    } else {
      libFunc.sendResponse(res, { status: 1, msg: "You are not admin" });
    }
  } catch (err) {
    console.error("Error in fetchTasks:", err);
    libFunc.sendResponse(res, { status: 0, msg: "Error fetching tasks" });
  }
}

function getTotalCountofTaskCreatedByMe(req, res) {
  const userid = req.data.userId;
  const orgid = req.data.orgId;
  const completion_startDate = req.data.completion_startDate;
  const completion_endDate = req.data.completion_endDate;
  const userDeptId = req.data.depId;
  const role = req.data.user_role;
  const filters = req.data.filters || {}; // HERE incoming/outgoing filter

  console.log("filete--", filters, userDeptId);

  let params = [orgid];
  let whereClauses = ["ta.organizationid = $1"];

  // Apply date range filters
  if (completion_startDate) {
    params.push(completion_startDate);
    whereClauses.push(`ta.completion_date >= $${params.length}`);
  }
  if (completion_endDate) {
    params.push(completion_endDate);
    whereClauses.push(`ta.completion_date <= $${params.length}`);
  }

  if (role === 2 && userDeptId) {
    params.push(userDeptId);

    whereClauses.push(`
            (
                created_by.deptid = $${params.length}
                OR EXISTS (
                    SELECT 1 
                    FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
                    JOIN ${schema}.users u ON u.row_id = assigned_to_id::text
                    WHERE u.deptid = $${params.length}
                )
            )
        `);
  }

  if (filters.outgoing === true && userDeptId) {
    console.log("outgoing task --- true");
    // Outgoing -> my dept → other dept
    params.push(userDeptId);

    whereClauses.push(`
            created_by.deptid = $${params.length} 
            AND EXISTS (
                SELECT 1 
                FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
                JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
                WHERE au.deptid != $${params.length}
            )
        `);
  }



  if (filters.outgoing === false && userDeptId) {
    console.log("incoming + my department internal tasks");

    params.push(userDeptId);
    const deptParam = params.length;

    whereClauses.push(`
        (
            (
                created_by.deptid <> $${deptParam}
                AND EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
                    JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
                    WHERE au.deptid = $${deptParam}
                )
            )
            OR
            (
                created_by.deptid = $${deptParam}
                AND EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements_text(ta.assigned_to) assigned_to_id
                    JOIN ${schema}.users au ON au.row_id = assigned_to_id::text
                    WHERE au.deptid = $${deptParam}
                )
            )
        )
    `);
  }

  const sqlquery = `
        SELECT 
            SUM(CASE WHEN ta.active_status = 0 THEN 1 ELSE 0 END) AS ongoing_count,
            SUM(CASE WHEN ta.active_status = 1 THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN ta.active_status = 2 THEN 1 ELSE 0 END) AS overdue_count,
            COUNT(*) AS total_count,
            SUM(CASE WHEN ta.task_type = '1' THEN 1 ELSE 0 END) AS recurring_count
        FROM ${schema}.tasks ta
        INNER JOIN ${schema}.users created_by ON ta.assigned_by = created_by.row_id
        WHERE ${whereClauses.join(" AND ")}
          AND created_by.activestatus = 0  
          AND EXISTS (
              SELECT 1
              FROM jsonb_array_elements_text(ta.assigned_to) AS assigned_to_id
              JOIN ${schema}.users u ON u.row_id = assigned_to_id::text
              WHERE u.activestatus = 0
          )
    `;

  connect_db.query(sqlquery, params, (err, result) => {
    if (err) {
      console.error("Error fetching task count:", err);
      return libFunc.sendResponse(res, {
        status: 0,
        msg: "Error fetching task count",
      });
    }

    console.log("result.rows[0]", result.rows[0]);
    return libFunc.sendResponse(res, {
      status: 1,
      msg: "Task count fetched successfully",
      data: result.rows[0],
    });
  });
}
