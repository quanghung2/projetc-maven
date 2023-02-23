import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Extension } from '@b3networks/api/bizphone';
import { ExtensionService, InboundRule } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface AssignInboundInput {
  inboundRules: InboundRule[];
  extension: Extension;
}

@Component({
  selector: 'b3n-assign-inbound-rule',
  templateUrl: './assign-inbound-rule.component.html',
  styleUrls: ['./assign-inbound-rule.component.scss']
})
export class AssignInboundRuleComponent implements OnInit {
  selectedRule: InboundRule;
  progressing: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AssignInboundInput,
    private extensionService: ExtensionService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<AssignInboundRuleComponent>
  ) {
    const ruleName = this.data.extension.incomingCallRule;
    this.selectedRule = this.data.inboundRules.find(rule => rule.name === ruleName);
  }

  ngOnInit(): void {}

  assign() {
    this.progressing = true;
    this.extensionService
      .update(this.data.extension.extKey, { incomingCallRule: this.selectedRule.name })
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close({ ok: true });
          this.toastService.success('Assigned successfully');
        },
        error => {
          console.log(error);

          this.toastService.error(error.message || 'Cannot assign rule. Please try again in a few minutes');
        }
      );
  }
}
