import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FlowActionReq, FlowService, SimpleFlow } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-delete-flow-dialog',
  templateUrl: './delete-flow-dialog.component.html',
  styleUrls: ['./delete-flow-dialog.component.scss']
})
export class DeleteFlowDialogComponent implements OnInit {
  deleting: boolean;
  type: number;
  permantlyDeleteCtrl = new UntypedFormControl();

  constructor(
    @Inject(MAT_DIALOG_DATA) public flow: SimpleFlow,
    private dialogRef: MatDialogRef<DeleteFlowDialogComponent>,
    private flowService: FlowService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.permantlyDeleteCtrl.valueChanges.subscribe(permantlyDelete => {
      if (permantlyDelete) {
        this.type = 4;
      } else {
        this.type = 3;
      }
    });

    if (!(this.flow.activeVersion && this.flow.draftVersion)) {
      this.permantlyDeleteCtrl.setValue(false);
    }
  }

  submit() {
    this.deleting = true;
    switch (this.type) {
      case 1: // Draft
        this.flowService
          .archiveFlow(<FlowActionReq>{ flowUuid: this.flow.uuid, version: this.flow.draftVersion })
          .pipe(finalize(() => (this.deleting = false)))
          .subscribe(
            _ => {
              this.toastService.success(`Flow has been deleted`);
              this.dialogRef.close(true);
            },
            error => {
              this.toastService.error(`Delete failed: ${error.message}`);
            }
          );
        break;
      case 2: // Active + Draft
        forkJoin([
          this.flowService.archiveFlow(<FlowActionReq>{ flowUuid: this.flow.uuid, version: this.flow.activeVersion }),
          this.flowService.archiveFlow(<FlowActionReq>{ flowUuid: this.flow.uuid, version: this.flow.draftVersion })
        ])
          .pipe(finalize(() => (this.deleting = false)))
          .subscribe(
            _ => {
              this.toastService.success(`Flow has been deleted`);
              this.dialogRef.close(true);
            },
            error => {
              this.toastService.error(`Delete failed: ${error.message}`);
            }
          );
        break;
      case 3: // Active or Draft
        this.flowService
          .archiveFlow(<FlowActionReq>{
            flowUuid: this.flow.uuid,
            version: this.flow.activeVersion ? this.flow.activeVersion : this.flow.draftVersion
          })
          .pipe(finalize(() => (this.deleting = false)))
          .subscribe(
            _ => {
              this.toastService.success(`Flow has been deleted`);
              this.dialogRef.close(true);
            },
            error => {
              this.toastService.error(`Delete failed: ${error.message}`);
            }
          );
        break;
      case 4: // Permanent delete
        this.flowService
          .deleteFlow(this.flow.uuid)
          .pipe(finalize(() => (this.deleting = false)))
          .subscribe(
            _ => {
              this.toastService.success(`Flow has been deleted`);
              this.dialogRef.close(true);
            },
            error => {
              this.toastService.error(`Delete failed: ${error.message}`);
            }
          );
        break;
    }
  }
}
