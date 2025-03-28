selectedRow: any = null;
selectedAction: string | null = null; // Store selected action separately

viewchatboxbtn(Patient: any) {
  this.selectedRow = Patient;
  this.selectedAction = 'view';
}

historybtn(Patient: any) {
  this.selectedRow = Patient;
  this.selectedAction = 'history';
}

formulationbtn(Patient: any) {
  this.selectedRow = Patient;
  this.selectedAction = 'formulation';
}

diagnosisbtn(Patient: any) {
  this.selectedRow = Patient;
  this.selectedAction = 'diagnosis';
}

ratebtn(Patient: any) {
  this.selectedRow = Patient;
  this.selectedAction = 'rate';
}


<button
    mat-flat-button
    type="button"
    class="ml-2"
    [style.background-color]="
        selectedRow === row && selectedAction === 'view' ? 'orange' : 'deepskyblue'
    "
    (click)="viewchatboxbtn(row)"
>
    View
</button>

<button
    mat-flat-button
    type="button"
    class="ml-2"
    [style.background-color]="
        selectedRow === row && selectedAction === 'history' ? 'orange' : 'deepskyblue'
    "
    (click)="historybtn(row)"
>
    History
</button>

<button
    mat-flat-button
    type="button"
    class="ml-2"
    [style.background-color]="
        selectedRow === row && selectedAction === 'formulation' ? 'orange' : 'deepskyblue'
    "
    (click)="formulationbtn(row)"
>
    Formulation
</button>

<button
    mat-flat-button
    type="button"
    class="ml-2"
    [style.background-color]="
        selectedRow === row && selectedAction === 'diagnosis' ? 'orange' : 'deepskyblue'
    "
    (click)="diagnosisbtn(row)"
>
    Diagnosis
</button>

<button
    mat-flat-button
    type="button"
    class="ml-2"
    [style.background-color]="
        selectedRow === row && selectedAction === 'rate' ? 'orange' : 'deepskyblue'
    "
    (click)="ratebtn(row)"
>
    Rate
</button>
