app.post("/webhook", async (req, res) => {
  try {
    const changes = req.body.entry?.[0]?.changes?.[0];

    const messages = changes?.value?.messages;
    const statuses = changes?.value?.statuses; // delivery/read updates

    // Insert incoming messages
    if (messages) {
      for (const msg of messages) {
        const waMessageId = msg.id;
        const phone = msg.from;
        const body = msg.text?.body || "";
        const others_data = JSON.stringify(msg);

        const row_id = libFunc.randomid();

        await queries.customQuery(`
          INSERT INTO wap.messages 
            (row_id, phone, direction, body, message_id, others_data)
          VALUES ('${row_id}', '${phone}', 'in', '${body}', '${waMessageId}', '${others_data}')
        `);
      }
    }

    // Update outgoing message with message_id and status
    if (statuses) {
      for (const status of statuses) {
        const waMessageId = status.id;
        const messageStatus = status.status; // sent, delivered, read, failed

        await queries.customQuery(`
          UPDATE wap.messages
          SET status='${messageStatus}', message_id='${waMessageId}', up_on=now()
          WHERE phone='${status.recipient_id}'
        `);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});



async function sendMessageContact(req, res) {
  try {
    const { phone_no, msg } = req.data || {};
    const org = req.organization_id;

    if (!phone_no || !msg || !org) {
      return libFunc.sendResponse(res, {
        status: 1,
        msg: "Missing required fields",
      });
    }

    // Fetch API credentials
    const checkQuery = `
      SELECT waba_id, business_id, phone_number_id, access_token
      FROM wap.api_credentials
      WHERE organization_id = '${org}'
      LIMIT 1
    `;
    const checkResult = await queries.customQuery(checkQuery);

    if (!checkResult || checkResult.length === 0) {
      return libFunc.sendResponse(res, {
        status: 1,
        msg: "No API credentials found for this organization",
      });
    }

    const { waba_id, business_id, phone_number_id, access_token } = checkResult[0];

    // Initialize WhatsApp SDK
    const wadata = new WhatsAppSDK({
      accessToken: access_token,
      phoneNumberId: phone_number_id,
      wabaId: waba_id,
      verifyToken: process.env.WEBHOOK_VERIFY_TOKEN,
      appSecret: process.env.APP_SECRET,
    });

    // Save outgoing message in DB with status 'pending'
    const row_id = libFunc.randomid();
    await queries.customQuery(`
      INSERT INTO ${messagesTable} 
        (row_id, phone, direction, body, organization_id, status)
      VALUES ('${row_id}', '${phone_no}', 'out', '${msg}', '${org}', 'pending')
    `);
    
    // Send message via WhatsApp
    try {
      await wadata.sendText({ to: phone_no, body: msg });
      console.log("Message request sent to WhatsApp API");
    } catch (err) {
      console.error("WhatsApp send error:", err.message);
      // Status remains 'pending' until webhook confirms
    }
    

    return libFunc.sendResponse(res, {
      status: 0,
      msg: "Message request processed successfully",
      row_id,
      waMessageId
    });

  } catch (err) {
    return libFunc.sendResponse(res, {
      status: 1,
      msg: "Server error",
      error: err.message,
    });
  }
}



async sendText({
    to,
    body,
    previewUrl = false,
    replyTo = null,
    phoneNumberId = null,
  }) {
    const sender = phoneNumberId || this.phoneNumberId;
    if (!sender)
      throw new Error("phoneNumberId is required (config or param).");

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body, preview_url: !!previewUrl },
    };
    if (replyTo) payload.context = { message_id: replyTo };

    const data = await this._request(`${sender}/messages`, {
      method: "POST",
      body: payload,
    });

    console.log("Full sendText response:-------------------", data);

    // Extract WhatsApp message_id safely
    const waMessageId = data?.messages?.[0]?.id || data?.message?.id || null;

    return { waMessageId, raw: data };
  }


async _request(path, { method = "GET", body = null, query = {} } = {}) {
    const token = await this._getToken();
    const appsecret_proof = this._appsecretProof(token);

    const qs = new URLSearchParams(query);
    if (appsecret_proof) qs.set("appsecret_proof", appsecret_proof);

    const url = `${this.apiBaseURL}/${path}${qs.toString() ? `?${qs}` : ""}`;

    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => controller.abort(), this.timeoutMs)
      : null;

    let res;
    try {
      res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : null,
        signal: controller ? controller.signal : undefined,
      });
    } finally {
      if (timer) clearTimeout(timer);
    }

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const msg = data?.error?.message || `HTTP ${res.status}`;
      const code = data?.error?.code;
      const type = data?.error?.type;
      const details = { status: res.status, code, type, message: msg };
      const e = new Error(`Graph API error: ${msg}`);
      e.details = details;
      throw e;
    }

    return data;
  }




  async function fetchTasks(req, res) {
    try {
        const userid = req.data.userId;
        const organizationid = req.data.orgId;
        const role = req.data.user_role; // 0 = normal, 1 = admin
        const statusFilter = req.data.status; // ongoing, complete, overdue
        const filters = req.data.filters || {}; // optional filters object

        const limit = req.data.limit || 100;
        const page = req.data.page || 1;
        const offset = (page - 1) * limit;

        let params = [organizationid];
        let whereClauses = ["ta.organizationid = $1", "ta.active_status = 0"];

        // 🟡 Status Filter
        if (statusFilter) {
            const active_status_map = { ongoing: 0, complete: 1, overdue: 2 };
            const active_status = active_status_map[statusFilter.toLowerCase()];
            if (active_status !== undefined) {
                params.push(active_status);
                whereClauses.push(`ta.active_status = $${params.length}`);
            }
        }

        // 🟡 Completion Date Filters
        if (filters.completion_startDate) {
            params.push(filters.completion_startDate);
            whereClauses.push(`ta.completion_date >= $${params.length}`);
        }
        if (filters.completion_endDate) {
            params.push(filters.completion_endDate);
            whereClauses.push(`ta.completion_date <= $${params.length}`);
        }

        // 🟡 Department
        if (filters.department_id?.length) {
            params.push(filters.department_id);
            whereClauses.push(`us1.deptid = ANY($${params.length})`);
        }

        // 🟡 Assigned To
        if (filters.assigned_to?.length) {
            params.push(filters.assigned_to);
            whereClauses.push(`assigned_to_id::text = ANY($${params.length})`);
        }

        // 🟡 Assigned By
        if (filters.assigned_by?.length) {
            params.push(filters.assigned_by);
            whereClauses.push(`ta.assigned_by = ANY($${params.length})`);
        }

        // 🟡 Task Type (Normal / Recurring)
        if (filters.type) {
            params.push(filters.type.toLowerCase() === "normal" ? '0' : '1');
            whereClauses.push(`ta.task_type = $${params.length}`);
        }

        // 🟡 Frequency (Daily / Weekly / Monthly / Yearly)
        if (filters.frequency) {
            params.push(filters.frequency);
            whereClauses.push(`rt.schedule_details->>'type' = $${params.length}`);
        }

        // 🟡 Pagination
        params.push(limit);
        params.push(offset);

        // 🧾 Final Query
        const query = `
            SELECT
                ta.row_id,
                ta.title,
                ta.description,
                ta.checklist,
                ta.completion_date,
                us1.name AS created_by,
                COALESCE(dept.department_name, 'Owner') AS created_by_department,
                ta.cr_on AS created_at,
                json_agg(us.name) AS assigned_to,
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
            LEFT JOIN ${schema}.users us2 ON ta.completed_by = us2.row_id
            LEFT JOIN ${schema}.recurring_task rt 
                ON ta.recurringid = rt.row_id
            WHERE ${whereClauses.join(" AND ")}
            GROUP BY ta.row_id, ta.checklist, us1.name, dept.department_name, us2.name, rt.schedule_details, rt.row_id
            ORDER BY ta.cr_on DESC
            LIMIT $${params.length - 1} OFFSET $${params.length};
        `;

        // 🪵 Debug Log 👇
        console.log("📌 WHERE CLAUSES =>", whereClauses);
        console.log("📌 PARAMS =>", params);
        console.log("📌 FINAL QUERY =>", query);

        // 🧑‍💻 Role Check
        if (role === 1) {
            const resp = await db_query.customQuery(query, "Tasks Fetched", params);
            libFunc.sendResponse(res, resp);
        } else {
            libFunc.sendResponse(res, { status: 1, msg: "You are not admin" });
        }

    } catch (err) {
        console.error("❌ Error in fetchTasks:", err);
        libFunc.sendResponse(res, { status: 0, msg: "Error fetching tasks" });
    }
}
