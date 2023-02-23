import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConsentService, StatusConsent } from '@b3networks/api/dnc';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-export-consent',
  templateUrl: './export-consent.component.html',
  styleUrls: ['./export-consent.component.scss']
})
export class ExportConsentComponent implements OnInit {
  email: string;
  progressing: boolean;

  readonly status: KeyValue<StatusConsent, string>[] = [
    { key: StatusConsent.notRecorded, value: 'Not Recorded' },
    { key: StatusConsent.blacklist, value: 'Blacklist' },
    { key: StatusConsent.whitelist, value: 'Whitelist' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialogRef: MatDialogRef<ExportConsentComponent>,
    private toastService: ToastService,
    private consentService: ConsentService
  ) {}

  ngOnInit() {}

  export() {
    this.progressing = true;
    this.consentService
      .export(this.email)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        () => {
          this.toastService.success(`Export file successfully`);
          this.dialogRef.close();
        },
        error => {
          this.toastService.warning(error.message);
        }
      );
  }
}
