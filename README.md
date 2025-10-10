To create a WhatsApp template with media (like Image / Video / Document) using the WhatsApp Cloud API, the process has two main steps:


---

🧩 STEP 1: Upload your media file to get media_id

Before you can create a template with media, you must upload the file to WhatsApp and get a media_id.

📤 API:

POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/media

🧾 Headers:

Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: multipart/form-data

📎 Body:

file: your media file (e.g., image.jpg, video.mp4, pdf)

type: MIME type (e.g., image/jpeg, video/mp4, application/pdf)

messaging_product: whatsapp


✅ Example (cURL):

curl -X POST "https://graph.facebook.com/v21.0/1234567890/media" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "type=image/jpeg" \
  -F "messaging_product=whatsapp"

📥 Response Example:

{
  "id": "1234567890123456"
}

👉 Save this id — this is your media_id.


---

🧰 STEP 2: Create Template with Media

Once you have media_id, you can create a template with header media (Image / Video / Document).

📤 API:

POST https://graph.facebook.com/v21.0/{WABA_ID}/message_templates

🧾 Headers:

Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

📝 Body Example (Image Template):

{
  "name": "media_promo_template",
  "language": "en_US",
  "category": "MARKETING",
  "components": [
    {
      "type": "HEADER",
      "format": "IMAGE",
      "example": {
        "header_handle": ["1234567890123456"]
      }
    },
    {
      "type": "BODY",
      "text": "Hello {{1}}, check out our new product launch!"
    },
    {
      "type": "FOOTER",
      "text": "Powered by MyCompany"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "View More",
          "url": "https://mywebsite.com"
        }
      ]
    }
  ]
}

> 🔸 header_handle must be the media_id you got in Step 1.



📥 Response Example:

{
  "id": "9876543210987654",
  "status": "PENDING",
  "category": "MARKETING"
}

🕒 After submission, the template goes for approval. Once approved, you can use it in messages.


---

🧲 Supported Media Formats for Templates

Media Type	Format	Max Size

Image	JPEG, PNG	5 MB
Video	MP4	16 MB
Document	PDF, DOC, DOCX, etc.	100 MB



---

📡 Optional: Fetch Media Back (Preview / Download)

You can also get media details or download it:

📤 API:

GET https://graph.facebook.com/v21.0/{MEDIA_ID}
Authorization: Bearer YOUR_ACCESS_TOKEN

📥 Response Example:

{
  "url": "https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=MEDIA_ID",
  "mime_type": "image/jpeg",
  "sha256": "..."
}

To download:

GET https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=MEDIA_ID


---

✅ Summary of Full Flow:

1. 📤 Upload file → get media_id


2. 🧰 Create template with header media → get template ID


3. 🕒 Wait for template approval


4. 💬 Send message using that template


5. 📥 Fetch media if needed.




---

If you want, I can give you the Node.js Express API code to:

📌 Upload Media

🧾 Create Media Template

📥 Fetch Media


👉 Would you like me to give you that Node.js code? (Yes/No)

        <p>{{ activeTemplate.header }}</p>
      </div>

      <div class="section" *ngIf="activeTemplate.body">
        <h4>Body</h4>
        <p>{{ activeTemplate.body }}</p>
      </div>

      <div class="section" *ngIf="activeTemplate.footer">
        <h4>Footer</h4>
        <p>{{ activeTemplate.footer }}</p>
      </div>

      <div class="section" *ngIf="activeTemplate.buttons?.length">
        <h4>Buttons</h4>
        <ul>
          <li *ngFor="let btn of activeTemplate.buttons">{{ btn.text }}</li>
        </ul>
      </div>

      <!-- ✅ Use Template Button -->
      <div class="use-template-btn">
        <button mat-flat-button color="primary" (click)="useTemplate()">
          Use Template
        </button>
      </div>
    </div>
  </div>

  <div class="actions">
    <button mat-stroked-button color="warn" (click)="closeDialog()">Close</button>
  </div>
</div>

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-template-view-dialog',
  templateUrl: './template-view-dialog.component.html',
  styleUrls: ['./template-view-dialog.component.scss']
})
export class TemplateViewDialogComponent {
  templates: any[] = [];
  activeTemplate: any = null;
  selectedTemplate: any = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<TemplateViewDialogComponent>
  ) {
    this.templates = data.templates || [];
  }

  onTemplateSelect(event: any) {
    this.activeTemplate = event.options[0].value;
  }

  useTemplate() {
    if (this.activeTemplate) {
      // ✅ Return selected template name to parent component
      this.dialogRef.close(this.activeTemplate.name);
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}


import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TemplateViewDialogComponent } from '../template-view-dialog/template-view-dialog.component';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-message-compose',
  templateUrl: './message-compose.component.html',
  styleUrls: ['./message-compose.component.scss']
})
export class MessageComposeComponent {
  messageText = '';
  templates: any[] = [];

  constructor(private dialog: MatDialog, private api: ApiService) {}

  openTemplateDialog() {
    this.api.fetchApprovedTemplates().subscribe((resp: any) => {
      if (resp.status === 0) {
        const dialogRef = this.dialog.open(TemplateViewDialogComponent, {
          width: '850px',
          data: { templates: resp.data },
        });

        // ✅ Get selected template name
        dialogRef.afterClosed().subscribe((selectedTemplateName) => {
          if (selectedTemplateName) {
            this.messageText = selectedTemplateName;
          }
        });
      }
    });
  }

  sendMessage() {
    if (!this.messageText.trim()) return;
    console.log('Message sent:', this.messageText);
    this.messageText = '';
  }
}



<div class="chatbox-container">
  <div class="chat-input">
    <mat-form-field appearance="outline" class="message-input">
      <input matInput placeholder="Type your message..." [(ngModel)]="messageText">
    </mat-form-field>

    <button mat-icon-button color="primary" (click)="openTemplateDialog()">
      <mat-icon>description</mat-icon>
    </button>

    <button mat-raised-button color="accent" (click)="sendMessage()">
      Send
    </button>
  </div>
</div>



.chatbox-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;

  .chat-input {
    display: flex;
    align-items: center;
    width: 600px;
    gap: 10px;

    .message-input {
      flex: 1;
    }

    button[mat-icon-button] {
      background: #f5f5f5;
      border-radius: 50%;
    }
  }
}

