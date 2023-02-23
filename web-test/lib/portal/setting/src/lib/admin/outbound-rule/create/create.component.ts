import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OutboundRule, OutboundRuleService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { InputStoreOutboundRule } from '../outbound-rule-list/outbound-rule-list.component';

@Component({
  selector: 'pos-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit, AfterViewInit {
  readonly defaultCountryIdList = [
    'SG',
    'MY',
    'IN',
    'TH',
    'CN',
    'HK',
    'ID',
    'AU',
    'PH',
    'US',
    'GB',
    'VN',
    'TW',
    'AE',
    'JP',
    'KR',
    'NZ',
    'DE',
    'FR',
    'PK'
  ];

  progressing: boolean;
  formGroup: UntypedFormGroup;

  constructor(
    private outboundRuleService: OutboundRuleService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<CreateComponent>,
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: InputStoreOutboundRule
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  ngAfterViewInit() {
    if (this.data?.name) {
      this.formGroup.setValue({ name: this.data.name });
    }
  }

  create() {
    if (!this.formGroup.controls['name'].value) return;

    this.progressing = true;
    const req = new OutboundRule();
    req.countryWhiteList = this.defaultCountryIdList;
    req.name = this.formGroup.controls['name'].value;
    this.outboundRuleService
      .createOutboundRule(req)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        result => {
          this.dialogRef.close(result);
          this.toastService.success('Created outbound rule successfully');
        },
        err => {
          this.toastService.error(err.message || 'Cannot create new outbound rule. Please try again later');
        }
      );
  }

  update() {
    if (!this.formGroup.controls['name'].value) return;

    this.progressing = true;
    this.outboundRuleService
      .updateOutboundRule(this.data.id, { name: this.formGroup.controls['name'].value })
      .subscribe(
        result => {
          this.toastService.success('Updated outbound rule successfully');
          this.dialogRef.close(result);
        },
        err => {
          this.toastService.error(err.message || 'Cannot update outbound rule. Please try again later');
        }
      );
  }
}
