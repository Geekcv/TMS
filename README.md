async function fetchApprovedTemplates(req, res) {
  try {
    const org = req.organization_id;
    console.log("Fetching approved templates →", org);

    // ✅ Fetch only approved templates from your DB
    const query = `
      SELECT 
        row_id,
        name,
        language,
        category,
        status,
        components,
        cr_on,
        up_on
      FROM wap.templates
      WHERE organization_id = '${org}'
      AND UPPER(status) = 'APPROVED'
      ORDER BY up_on DESC
    `;

    const templates = await queries.customQuery(query);

    if (!templates || templates.length === 0) {
      return libFunc.sendResponse(res, {
        status: 1,
        msg: "No approved templates found",
        data: [],
      });
    }

    // ✅ Format the data before sending (optional)
    const formatted = templates.map(tpl => ({
      id: tpl.row_id,
      name: tpl.name,
      category: tpl.category,
      language: tpl.language,
      status: tpl.status,
      header: tpl.components?.find?.(c => c.type === 'HEADER')?.text || '',
      body: tpl.components?.find?.(c => c.type === 'BODY')?.text || '',
      footer: tpl.components?.find?.(c => c.type === 'FOOTER')?.text || '',
      buttons: tpl.components?.find?.(c => c.type === 'BUTTONS')?.buttons || [],
      created: tpl.cr_on,
      updated: tpl.up_on,
    }));

    return libFunc.sendResponse(res, {
      status: 0,
      msg: "Approved templates fetched successfully",
      count: formatted.length,
      data: formatted,
    });

  } catch (err) {
    console.error("Error in fetchApprovedTemplates:", err);
    return libFunc.sendResponse(res, {
      status: 1,
      msg: "Server error while fetching approved templates",
      error: err.message,
    });
  }
}

<div class="dialog-container">
  <h2 class="title">Select Template</h2>

  <div class="content-container">
    <!-- Left: Template list -->
    <div class="template-list">
      <mat-selection-list [(ngModel)]="selectedTemplate" (selectionChange)="onTemplateSelect($event)">
        <mat-list-option *ngFor="let tpl of templates" [value]="tpl">
          {{ tpl.name }}
          <span class="status" [ngClass]="tpl.status.toLowerCase()">{{ tpl.status }}</span>
        </mat-list-option>
      </mat-selection-list>
    </div>

    <!-- Right: Template details -->
    <div class="template-details" *ngIf="activeTemplate">
      <h3>{{ activeTemplate.name }}</h3>
      <p><strong>Category:</strong> {{ activeTemplate.category }}</p>
      <p><strong>Language:</strong> {{ activeTemplate.language }}</p>
      <mat-divider></mat-divider>

      <div class="section" *ngIf="activeTemplate.header">
        <h4>Header</h4>
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

