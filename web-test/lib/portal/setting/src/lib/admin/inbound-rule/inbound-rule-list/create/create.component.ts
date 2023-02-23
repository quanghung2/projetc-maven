import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { CreateOrUpdateInboundRuleReq, InboundRuleService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit {
  progressing: boolean;
  formGroup: UntypedFormGroup;

  constructor(
    private inboundRuleService: InboundRuleService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<any>,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  create() {
    this.progressing = true;

    const req = { name: this.formGroup.controls['name'].value, type: 'accept' } as CreateOrUpdateInboundRuleReq;
    this.inboundRuleService
      .create(req)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close({ ok: true });
          this.toastService.success('Created successfully');
        },
        error => {
          this.toastService.error(error.message || 'Cannot create rule. Please try again in a few minutes');
        }
      );
  }
}
