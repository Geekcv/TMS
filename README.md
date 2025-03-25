!-- Actions Column (Fixed) -->
    <ng-container matColumnDef="actions" stickyEnd>
      <th mat-header-cell *matHeaderCellDef class="sticky-column">Actions</th>
      <td mat-cell *matCellDef="let element" class="sticky-column">
        <div class="action-buttons">
          <button mat-icon-button color="primary">
            <mat-icon>visibility</mat-icon>
          </button>
          <button mat-icon-button color="warn">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </td>
    </ng-container


    /* Table Container with Vertical Scrolling */
.table-container {
  max-height: 400px; /* Adjust as needed */
  overflow-y: auto;
  display: block;
  position: relative;
}

/* Ensures the table takes the full width */
table {
  width: 100%;
}

/* Sticky column for Actions */
.sticky-column {
  position: sticky;
  right: 0;
  background: white; /* Ensures it doesn't overlap */
  z-index: 2; /* Keeps it above other content */
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
}

/* Stack action buttons */
.action-buttons {
  display: flex;
  flex-direction: column; /* Stack buttons */
  gap: 5px; /* Adds spacing between buttons */
  align-items: center; /* Centers buttons */
}

/* Ensures action buttons remain visible */
.mat-icon-button {
  width: 36px; /* Set a fixed width */
  height: 36px;
}
  
