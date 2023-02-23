import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CallFlow, CallflowService } from '@b3networks/api/ivr';
import { finalize } from 'rxjs/operators';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'delete-flows',
  templateUrl: './delete-flows.component.html',
  styleUrls: ['./delete-flows.component.scss']
})
export class DeleteFlowsComponent implements OnInit {
  public deleting: boolean;
  flow: CallFlow;
  isLoaing: boolean;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CallFlow,
    private dialogRef: MatDialogRef<DeleteFlowsComponent>,
    private flowServices: CallflowService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.flow = this.data;
    this.isLoaing = false;
  }

  delete() {
    if (this.deleting) {
      return;
    }

    this.deleting = true;
    const ids = this.data.uuid;

    this.flowServices
      .deleteFlows(ids)
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe(
        (data: any) => {
          this.dialogRef.close(data);
          this.toastService.success('Deleted flow successfully!');
        },
        () => {
          this.toastService.error('Unexpected errors happened while deleting flows.!');
        }
      );
  }
}
