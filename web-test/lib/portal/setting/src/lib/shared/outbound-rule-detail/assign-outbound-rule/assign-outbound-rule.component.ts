import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExtensionService, OutboundRule } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface AssignOutboundInput {
  outbountRule: OutboundRule[];
  extKey: string;
}
@Component({
  selector: 'b3n-assign-outbound-rule',
  templateUrl: './assign-outbound-rule.component.html',
  styleUrls: ['./assign-outbound-rule.component.scss']
})
export class AssignOutboundComponent implements OnInit {
  selectedOutgoingRule: OutboundRule;
  progressing: boolean;
  extKey: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public assignOutboundInput: AssignOutboundInput,
    private extensionService: ExtensionService,
    private dialogRef: MatDialogRef<AssignOutboundComponent>,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  assign() {
    this.progressing = true;
    this.extensionService
      .update(this.assignOutboundInput.extKey, {
        outgoingCallRule: this.selectedOutgoingRule.name
      })
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close();
          this.toastService.success('Assigned successfully');
        },
        error => {
          this.toastService.error(error.message || 'Cannot update outgoingCallRule. Please try again later');
        }
      );
  }
}
