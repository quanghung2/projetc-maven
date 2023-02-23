import { Component } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { CreateFlowReq, FlowService } from '@b3networks/api/flow';
import { Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-create-flow-dialog',
  templateUrl: './create-flow-dialog.component.html',
  styleUrls: ['./create-flow-dialog.component.scss']
})
export class CreateFlowDialogComponent {
  loading: boolean;
  nameCtrl = new UntypedFormControl(
    '',
    Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
  );
  getErrorName = () => Utils.getErrorInput(this.nameCtrl);

  constructor(
    private dialogRef: MatDialogRef<CreateFlowDialogComponent>,
    private flowService: FlowService,
    private toastService: ToastService
  ) {}

  createFlow() {
    if (this.nameCtrl.valid) {
      this.loading = true;
      this.flowService
        .createFlow(<CreateFlowReq>{
          name: this.nameCtrl.value,
          type: 'NORMAL',
          description: ''
        })
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(
          flow => {
            this.toastService.success('Flow has been created');
            this.dialogRef.close(flow);
          },
          error => {
            this.toastService.error(error.message);
          }
        );
    }
  }
}
