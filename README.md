 background: #f5f5f5;
      border-radius: 50%;
    }
  }
}

// =========================================================
  // ================= Template Editing ======================
  // =========================================================
  /**
   * Edit an existing template
   * @param {string} wabaId
   * @param {string} templateId - Template ID to update
   * @param {Object} updates - { name?, category?, components?, language?, status? }
   * NOTE: Only specific fields may be editable per WhatsApp's rules.
   */
  async editTemplate(wabaId = this.wabaId, templateId, updates = {}) {
    if (!wabaId || !templateId) throw new Error('wabaId & templateId required');
    if (!updates || typeof updates !== 'object') throw new Error('updates object required');
    return this._request(`${wabaId}/message_templates/${templateId}`, { method: 'POST', body: updates });
  }

  // =========================================================
  // ===================== Media Upload ======================
  // =========================================================
  /**
   * Upload a media file (image, video, document, etc.)
   * @param {string} phoneNumberId
   * @param {Buffer|Blob|File|string} fileData - File buffer (Node) or Blob/File (Browser)
   * @param {string} mimeType - MIME type (e.g., 'image/jpeg', 'video/mp4')
   * @param {string} [filename] - Optional filename
   */
  async uploadMedia(phoneNumberId = this.phoneNumberId, fileData, mimeType, filename = 'file') {
    if (!phoneNumberId) throw new Error('phoneNumberId required');
    if (!fileData || !mimeType) throw new Error('fileData & mimeType required');

    const token = await this._getToken();
    const formData = new FormData();
    formData.append('file', fileData, filename);
    formData.append('messaging_product', 'whatsapp');

    const res = await fetch(`${this.apiBaseURL}/${phoneNumberId}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Media upload failed: ${data.error?.message || res.statusText}`);
    }
    return data; // contains media ID (used in message payloads)
  }

  // =========================================================
  // ===================== Media Fetch =======================
  // =========================================================
  /**
   * Fetch a media file using media ID
   * @param {string} mediaId
   * @returns {Promise<{ buffer: Buffer, mimeType: string }>} - Media content and type
   */
  async fetchMedia(mediaId) {
    if (!mediaId) throw new Error('mediaId required');

    const token = await this._getToken();
    const metadataRes = await fetch(`${this.apiBaseURL}/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const metadata = await metadataRes.json();
    if (!metadata.url) throw new Error('Invalid media metadata response.');

    const mediaRes = await fetch(metadata.url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const buffer = await mediaRes.arrayBuffer();
    return {
      buffer: Buffer.from(buffer),
      mimeType: metadata.mime_type
    };
  }



const sdk = new WhatsAppSDK({
  accessToken: process.env.WHATSAPP_TOKEN,
  wabaId: process.env.WABA_ID,
  phoneNumberId: process.env.PHONE_NUMBER_ID
});

// ✅ Upload an image
const fs = require('fs');
const imageBuffer = fs.readFileSync('./banner.jpg');
const uploadResp = await sdk.uploadMedia(null, imageBuffer, 'image/jpeg', 'banner.jpg');
console.log('Uploaded media ID:', uploadResp.id);

// ✅ Edit an existing template
await sdk.editTemplate(process.env.WABA_ID, '1234567890', {
  components: [
    { type: 'BODY', text: 'Updated message body here!' }
  ]
});

// ✅ Fetch media by ID
const media = await sdk.fetchMedia(uploadResp.id);
fs.writeFileSync('./downloaded.jpg', media.buffer);
console.log('Media downloaded with type:', media.mimeType);




// =========================================================
  // ================== Campaign Management ==================
  // =========================================================
  /**
   * List all campaigns under a WABA
   * @param {string} wabaId
   * @param {Object} [options] - { limit, after, before, status }
   */
  async listCampaigns(wabaId = this.wabaId, options = {}) {
    if (!wabaId) throw new Error('wabaId required');
    const query = {};
    if (options.limit) query.limit = String(options.limit);
    if (options.after) query.after = options.after;
    if (options.before) query.before = options.before;
    if (options.status) query.status = options.status; // e.g., ACTIVE, PAUSED, COMPLETED
    return this._request(`${wabaId}/whatsapp_campaigns`, { query });
  }

  /**
   * Get campaign details by ID
   * @param {string} campaignId
   */
  async getCampaign(campaignId) {
    if (!campaignId) throw new Error('campaignId required');
    return this._request(`${campaignId}`);
  }

  /**
   * Create a new WhatsApp campaign
   * @param {Object} cfg
   * @param {string} cfg.wabaId - WhatsApp Business Account ID
   * @param {string} cfg.name - Campaign name
   * @param {string} cfg.templateName - Template name to use
   * @param {string} cfg.language - Template language (e.g., en_US)
   * @param {string[]} cfg.to - Array of recipient phone numbers
   * @param {Object[]} [cfg.components] - Template components if dynamic
   * @param {string} [cfg.scheduleTime] - Optional future ISO date for scheduling
   */
  async createCampaign({ wabaId = this.wabaId, name, templateName, language, to, components = null, scheduleTime = null }) {
    if (!wabaId || !name || !templateName || !language || !Array.isArray(to) || !to.length) {
      throw new Error('wabaId, name, templateName, language, and recipient list required');
    }

    const payload = {
      name,
      messaging_product: 'whatsapp',
      template: {
        name: templateName,
        language: { code: language }
      },
      to,
    };

    if (components) payload.template.components = components;
    if (scheduleTime) payload.schedule_time = scheduleTime; // ISO date string

    return this._request(`${wabaId}/whatsapp_campaigns`, { method: 'POST', body: payload });
  }

  /**
   * Pause a campaign
   * @param {string} campaignId
   */
  async pauseCampaign(campaignId) {
    if (!campaignId) throw new Error('campaignId required');
    return this._request(`${campaignId}`, { method: 'POST', body: { status: 'PAUSED' } });
  }

  /**
   * Resume a paused campaign
   * @param {string} campaignId
   */
  async resumeCampaign(campaignId) {
    if (!campaignId) throw new Error('campaignId required');
    return this._request(`${campaignId}`, { method: 'POST', body: { status: 'ACTIVE' } });
  }

  /**
   * Delete a campaign
   * @param {string} campaignId
   */
  async deleteCampaign(campaignId) {
    if (!campaignId) throw new Error('campaignId required');
    return this._request(`${campaignId}`, { method: 'DELETE' });
  }



const sdk = new WhatsAppSDK({
  accessToken: process.env.WHATSAPP_TOKEN,
  wabaId: process.env.WABA_ID
});

// ✅ Create a campaign
const newCamp = await sdk.createCampaign({
  name: 'Festive Offer Campaign',
  templateName: 'festive_offer',
  language: 'en_US',
  to: ['919876543210', '919123456789'],
  components: [
    { type: 'body', parameters: [{ type: 'text', text: '50% OFF on all products!' }] }
  ],
  scheduleTime: '2025-10-10T12:00:00Z'
});
console.log('Created campaign:', newCamp);

// ✅ List campaigns
const campaigns = await sdk.listCampaigns();
console.log('Campaigns:', campaigns);

// ✅ Pause campaign
await sdk.pauseCampaign(newCamp.id);

// ✅ Resume campaign
await sdk.resumeCampaign(newCamp.id);

// ✅ Delete campaign
await sdk.deleteCampaign(newCamp.id);

  
  
