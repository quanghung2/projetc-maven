import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { ControlContainer, NgForm, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PersonalWhitelist, PersonalWhitelistService, StatusConsent } from '@b3networks/api/dnc';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface AddPersonalWhitelistData {
  isCreate: boolean;
  whitelist: PersonalWhitelist;
}

@Component({
  selector: 'b3n-add-personal-whitelist',
  templateUrl: './add-personal-whitelist.component.html',
  styleUrls: ['./add-personal-whitelist.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddPersonalWhitelistComponent extends DestroySubscriberComponent implements OnInit {
  isProcessing: boolean;
  group = this.fb.group({
    number: [null, [Validators.required]],
    voice: [StatusConsent.none, [Validators.required]],
    sms: [StatusConsent.none, [Validators.required]],
    fax: [StatusConsent.none, [Validators.required]]
  });
  isCreate: boolean;

  readonly status: KeyValue<StatusConsent, string>[] = [
    { key: StatusConsent.none, value: 'None' },
    { key: StatusConsent.whitelist, value: 'Whitelist' }
  ];

  get number() {
    return this.group.get('number');
  }

  get voice() {
    return this.group.get('voice');
  }

  get sms() {
    return this.group.get('sms');
  }

  get fax() {
    return this.group.get('fax');
  }

  constructor(
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<AddPersonalWhitelistComponent>,
    public dialog: MatDialog,
    private personalWhitelistService: PersonalWhitelistService,
    @Inject(MAT_DIALOG_DATA) private data: AddPersonalWhitelistData
  ) {
    super();
    this.isCreate = data.isCreate;

    if (!this.isCreate) {
      try {
        let number = this.data.whitelist.number;
        if (number.startsWith('+')) {
          number = number.substring(1);
        }
        this.group.setValue({
          number: +number,
          voice: this.data.whitelist?.voice ? StatusConsent.whitelist : StatusConsent.none,
          sms: this.data.whitelist?.sms ? StatusConsent.whitelist : StatusConsent.none,
          fax: this.data.whitelist?.fax ? StatusConsent.whitelist : StatusConsent.none
        });
        this.number.disable();
      } catch {}
    }
  }

  ngOnInit() {}

  onSave() {
    const req = <Partial<PersonalWhitelist>>{
      voice: this.voice.value === StatusConsent.whitelist,
      sms: this.sms.value === StatusConsent.whitelist,
      fax: this.fax.value === StatusConsent.whitelist
    };
    this.personalWhitelistService.addNumber('+' + this.number.value, req).subscribe(
      _ => {
        this.toastService.success(
          `${this.data.isCreate ? 'Add' : 'Update'} successfully with +${this.number.value} number`
        );
        this.dialogRef.close(true);
      },
      err => this.toastService.error(err.message)
    );
  }
}
