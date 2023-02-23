import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CreateSubroutineReq, Flow, FlowActionReq, FlowQuery, FlowService, UpdateFlowReq } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-update-subroutine-dialog',
  templateUrl: './update-subroutine-dialog.component.html',
  styleUrls: ['./update-subroutine-dialog.component.scss']
})
export class UpdateSubroutineDialogComponent implements OnInit {
  flow: Flow;
  invalid: boolean;
  configs: CreateSubroutineReq;
  updating: boolean;

  constructor(
    private flowService: FlowService,
    private flowQuery: FlowQuery,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<UpdateSubroutineDialogComponent>
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
            subroutineInput: this.configs.input,
            subroutineOutput: this.configs.output
          }
        )
        .pipe(finalize(() => (this.updating = false)))
        .subscribe({
          next: () => {
            this.toastService.success('Flow has been updated');
            this.dialogRef.close();
          },
          error: err => this.toastService.error(err.message)
        });
    }
  }
}
