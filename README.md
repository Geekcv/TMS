<p-table [value]="projects" responsiveLayout="scroll"
[paginator]="true" 
  [rows]="2" 
  [rowsPerPageOptions]="[2, 3, 5]" 
  [showCurrentPageReport]="true" 
  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
>
