import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Consent, ConsentService, StatusConsent } from '@b3networks/api/dnc';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-add-consent-number',
  templateUrl: './add-consent-number.component.html',
  styleUrls: ['./add-consent-number.component.scss']
})
export class AddConsentNumberComponent implements OnInit {
  noEmail: boolean;
  req = <Consent>{};
  progressing: boolean;
  numbers = new Set<string>();
  emails = new Set<string>();
  consent: Consent;
  isEdit: boolean;

  readonly status: KeyValue<StatusConsent, string>[] = [
    { key: StatusConsent.notRecorded, value: 'Not Recorded' },
    { key: StatusConsent.blacklist, value: 'Blacklist' },
    { key: StatusConsent.whitelist, value: 'Whitelist' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { consent: Consent },
    private dialogRef: MatDialogRef<AddConsentNumberComponent>,
    private toastService: ToastService,
    private consentService: ConsentService
  ) {
    this.consent = this.data?.consent;
    if (this.consent) {
      this.req = Object.assign(new Consent(), this.consent);
      this.isEdit = true;
    } else {
      this.isEdit = false;
      this.req = <Consent>{
        orgUuid: X.orgUuid,
        sms: StatusConsent.notRecorded,
        fax: StatusConsent.notRecorded,
        voice: StatusConsent.notRecorded
      };
    }
  }

  ngOnInit() {}

  create() {
    this.progressing = true;
    this.consentService
      .add(this.req)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        consent => {
          this.dialogRef.close(consent);
          this.toastService.success(`Created consent successfully`);
        },
        error => {
          this.toastService.warning(error.message);
        }
      );
  }

  update() {
    this.progressing = true;
    this.consentService
      .update(this.req)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        consent => {
          this.dialogRef.close(consent);
          this.toastService.success(`Updated consent successfully`);
        },
        error => {
          this.toastService.warning(error.message);
        }
      );
  }
}
