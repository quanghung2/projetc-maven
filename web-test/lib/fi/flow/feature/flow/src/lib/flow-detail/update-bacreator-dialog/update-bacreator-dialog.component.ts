import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { BodyParameter, Flow, FlowActionReq, FlowQuery, FlowService, UpdateFlowReq } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-update-bacreator-dialog',
  templateUrl: './update-bacreator-dialog.component.html',
  styleUrls: ['./update-bacreator-dialog.component.scss']
})
export class UpdateBaCreatorDialogComponent implements OnInit {
  flow: Flow;
  invalid: boolean;
  parameters: BodyParameter[] = [];
  updating: boolean;

  constructor(
    private flowService: FlowService,
    private flowQuery: FlowQuery,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<UpdateBaCreatorDialogComponent>
  ) {}

  ngOnInit(): void {
    this.flow = this.flowQuery.getValue();
  }

  update() {
    if (!this.invalid && this.flow.editable) {
      this.updating = true;
      this.flowService
        .updateFlow(
          <FlowActionReq>{
            flowUuid: this.flow.uuid,
            version: this.flow.version
          },
          <UpdateFlowReq>{
            name: this.flow.name,
            description: this.flow.description,
            businessActionInput: {
              parameters: this.parameters
            }
          }
        )
        .pipe(finalize(() => (this.updating = false)))
        .subscribe({
          next: () => {
            this.toastService.success('Business action has been updated');
            this.dialogRef.close();
          },
          error: error => this.toastService.error(error.message)
        });
    }
  }
}
