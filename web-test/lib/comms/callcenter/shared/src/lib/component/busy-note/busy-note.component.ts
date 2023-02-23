import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { OrgConfigQuery, OrgConfigService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'b3n-busy-note',
  templateUrl: './busy-note.component.html',
  styleUrls: ['./busy-note.component.scss']
})
export class BusyNoteComponent implements OnInit {
  busyRemarks$: Observable<string[]>;
  reason: string;

  constructor(
    public dialogRef: MatDialogRef<BusyNoteComponent>,
    private orgConfigQuery: OrgConfigQuery,
    private orgConfigService: OrgConfigService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.busyRemarks$ = this.orgConfigQuery.busyRemarks$;

    this.orgConfigService
      .getConfig()
      .pipe(
        catchError(error => {
          this.toast.warning(error.message);
          return error;
        })
      )
      .subscribe();
  }

  submit() {
    this.dialogRef.close({ reason: this.reason });
  }
}
