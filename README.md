<div class="table-container">
  <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z8">

    <!-- Columns Definition -->
    <ng-container matColumnDef="id">
      <th mat-header-cell *matHeaderCellDef>#</th>
      <td mat-cell *matCellDef="let element">{{ element.id }}</td>
    </ng-container>

    <ng-container matColumnDef="name">
      <th mat-header-cell *matHeaderCellDef>Name</th>
      <td mat-cell *matCellDef="let element">{{ element.name }}</td>
    </ng-container>

    <ng-container matColumnDef="email">
      <th mat-header-cell *matHeaderCellDef>Email</th>
      <td mat-cell *matCellDef="let element">{{ element.email }}</td>
    </ng-container>

    <ng-container matColumnDef="phone">
      <th mat-header-cell *matHeaderCellDef>Phone/Mobile</th>
      <td mat-cell *matCellDef="let element">{{ element.phone }}</td>
    </ng-container>

    <ng-container matColumnDef="qualifications">
      <th mat-header-cell *matHeaderCellDef>Qualifications</th>
      <td mat-cell *matCellDef="let element">{{ element.qualifications }}</td>
    </ng-container>

    <ng-container matColumnDef="qualificationDetails">
      <th mat-header-cell *matHeaderCellDef>Qualification Details</th>
      <td mat-cell *matCellDef="let element">{{ element.qualificationDetails }}</td>
    </ng-container>

    <!-- Actions Column (Stacked) -->
    <ng-container matColumnDef="actions">
      <th mat-header-cell *matHeaderCellDef>Actions</th>
      <td mat-cell *matCellDef="let element">
        <div class="action-buttons">
          <button mat-icon-button color="primary">
            <mat-icon>visibility</mat-icon>
          </button>
          <button mat-icon-button color="warn">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </td>
    </ng-container>

    <!-- Table Headers & Rows -->
    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
  </table>
</div>




.table-container {
  max-height: 400px; /* Adjust as needed */
  overflow-y: auto;
  display: block;
}

table {
  width: 100%;
}

.action-buttons {
  display: flex;
  flex-direction: column; /* Stack buttons */
  gap: 5px; /* Add spacing between buttons */
}

.mat-icon-button {
  width: 36px; /* Set fixed width */
  height: 36px;
}
