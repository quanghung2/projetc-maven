import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { ControlContainer, FormControl, NgForm, UntypedFormBuilder, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrgConsent, OrgConsentService, StatusConsent } from '@b3networks/api/dnc';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface StoreContactData {
  isCreate: boolean;
  orgConsent: OrgConsent;
}

class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}

@Component({
  selector: 'b3n-store-contact',
  templateUrl: './store-contact.component.html',
  styleUrls: ['./store-contact.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class StoreContactComponent extends DestroySubscriberComponent implements OnInit {
  isCreate: boolean;
  isProcessing: boolean;
  matcher = new MyErrorStateMatcher();
  orgConsentGroup = this.fb.group({
    prefix: [null, [Validators.required]],
    voice: [StatusConsent.none, [Validators.required]],
    sms: [StatusConsent.none, [Validators.required]],
    fax: [StatusConsent.none, [Validators.required]]
  });

  readonly status: KeyValue<StatusConsent, string>[] = [
    { key: StatusConsent.none, value: 'None' },
    { key: StatusConsent.whitelist, value: 'Whitelist' },
    { key: StatusConsent.blacklist, value: 'Blacklist' }
  ];

  get prefix() {
    return this.orgConsentGroup.get('prefix');
  }

  get voice() {
    return this.orgConsentGroup.get('voice');
  }

  get sms() {
    return this.orgConsentGroup.get('sms');
  }

  get fax() {
    return this.orgConsentGroup.get('fax');
  }

  constructor(
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<StoreContactComponent>,
    @Inject(MAT_DIALOG_DATA) private data: StoreContactData,
    public dialog: MatDialog,
    private orgConsentService: OrgConsentService
  ) {
    super();
    this.isCreate = data.isCreate;
    if (!this.isCreate) {
      try {
        let number = this.data.orgConsent.number;
        if (number.startsWith('+')) {
          number = number.substring(1);
        }
        this.orgConsentGroup.setValue({
          prefix: +number,
          voice: this.data.orgConsent?.voice,
          sms: this.data.orgConsent?.sms,
          fax: this.data.orgConsent?.fax
        });
        this.prefix.disable();
      } catch {}
    }
  }

  ngOnInit() {}

  onSave() {
    if (this.isCreate) {
      this.orgConsentService.update('+' + this.prefix.value, this.orgConsentGroup.value).subscribe(
        _ => {
          this.toastService.success(`Create successfully with +${this.prefix.value} number`);
          this.dialogRef.close('+' + this.prefix.value);
        },
        err => this.toastService.error(err.message)
      );
    } else {
      this.orgConsentService.update(this.data.orgConsent.number, this.orgConsentGroup.value).subscribe(
        _ => {
          this.toastService.success(`Update successfully with +${this.prefix.value} number`);
          this.dialogRef.close('+' + this.prefix.value);
        },
        err => this.toastService.error(err.message)
      );
    }
  }
}
