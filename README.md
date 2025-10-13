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
  
