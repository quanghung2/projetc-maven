import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Workflow, WorkflowService, WorkflowStatus, WorkflowVersion } from '@b3networks/api/ivr';
import { ConfirmDialogComponent } from '@b3networks/shared/ui/confirm-dialog';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { DeployScheduleComponent } from '../deploy-schedule/deploy-schedule.component';

export interface VersionHistoryInput {
  workflow: Workflow;
  currentVersion: number;
  isAdmin: boolean;
}
@Component({
  selector: 'b3n-version-history',
  templateUrl: './version-history.component.html',
  styleUrls: ['./version-history.component.scss']
})
export class VersionHistoryComponent implements OnInit {
  readonly WorkflowStatus = WorkflowStatus;
  readonly displayedColumns: string[] = ['version', 'informations', 'actions'];
  workflow: Workflow;
  dataSource: WorkflowVersion[];
  progressing: boolean;
  isAdmin: boolean;
  version: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VersionHistoryInput,
    private spinner: LoadingSpinnerSerivce,
    private workflowService: WorkflowService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<VersionHistoryComponent>
  ) {
    this.workflow = data.workflow;
    this.isAdmin = data.isAdmin;
    this.version = +data.currentVersion;
  }

  ngOnInit() {
    this.initHistoryVersion();
  }

  initHistoryVersion() {
    this.spinner.showSpinner();
    this.workflowService
      .getVersion(this.workflow.uuid)
      .pipe(finalize(() => this.spinner.hideSpinner()))
      .subscribe(
        dataSource => {
          this.dataSource = dataSource;
          this.dataSource.sort((a, b) => b.version - a.version);
        },
        err => this.toastService.error(`Cannot load version history. Please try again later!`)
      );
  }

  removeVersion(workflowVersion: WorkflowVersion) {
    this.dialog
      .open(ConfirmDialogComponent, {
        minWidth: `400px`,
        data: {
          message: `Do you want to delete <strong>version ${workflowVersion.version}.0?</strong>`,
          title: `Delete version`
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.spinner.showSpinner();
          this.workflowService
            .removeVersion(workflowVersion.workFlowUuid, workflowVersion.version)
            .pipe(finalize(() => this.spinner.hideSpinner()))
            .subscribe(
              result => {
                this.dialogRef.close(result);
                this.toastService.success(`Deleted successfully!`);
              },
              err => this.toastService.error(`Cannot delete flow. Please try again later!`)
            );
        }
      });
  }

  routingWorkflow(workflowVersion: WorkflowVersion) {
    if (workflowVersion.status === WorkflowStatus.preparing || workflowVersion.status === WorkflowStatus.deleting) {
      return;
    }
    this.dialogRef.close(workflowVersion);
  }

  rollback(workflowVersion: WorkflowVersion) {
    this.dialog
      .open(ConfirmDialogComponent, {
        minWidth: `400px`,
        data: {
          message: `Are you sure to rollback <strong>version ${workflowVersion.version}.0?</strong>`,
          title: `Rollback version`,
          confirmLabel: `Rollback`
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.spinner.showSpinner();
          this.workflowService
            .rollbackVersion(workflowVersion.workFlowUuid, workflowVersion.version)
            .pipe(finalize(() => this.spinner.hideSpinner()))
            .subscribe(
              result => {
                if (result) {
                  this.dialogRef.close(workflowVersion);
                  this.toastService.success(`Rolled back successfully!`);
                }
              },
              error1 => this.toastService.error(error1.message)
            );
        }
      });
  }

  cancelSchedule(workflowVersion: WorkflowVersion) {
    let messege, title: string;
    if (!this.isAdmin) {
      title = workflowVersion.status === WorkflowStatus.pending ? `Cancel request go live` : `Cancel schedule`;
      messege =
        workflowVersion.status === WorkflowStatus.pending
          ? `Are you sure to cancel request go live <strong>version ${workflowVersion.version}.0?</strong>`
          : `Are you sure to cancel schedule <strong>version ${workflowVersion.version}.0?</strong>`;
    } else {
      title = workflowVersion.status === WorkflowStatus.pending ? `Reject request go live` : `Cancel schedule`;
      messege =
        workflowVersion.status === WorkflowStatus.pending
          ? `Are you sure to reject request go live <strong>version ${workflowVersion.version}.0?</strong>`
          : `Are you sure to cancel schedule <strong>version ${workflowVersion.version}.0?</strong>`;
    }
    this.dialog
      .open(ConfirmDialogComponent, {
        minWidth: `400px`,
        data: {
          message: messege,
          title: title
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.spinner.showSpinner();
          this.workflowService
            .rejectVersion(workflowVersion.workFlowUuid)
            .pipe(finalize(() => this.spinner.hideSpinner()))
            .subscribe(
              wv => {
                this.dialogRef.close(wv);
                this.toastService.success(
                  this.isAdmin && workflowVersion.status === WorkflowStatus.pending
                    ? `Rejected successfully!`
                    : `Canceled  successfully!`
                );
              },
              error1 =>
                this.toastService.error(
                  error1.message || workflowVersion.status === WorkflowStatus.pending
                    ? `Cannot cancel request go live. Please try again later!`
                    : `Cannot cancel schedule. Please try again later!`
                )
            );
        }
      });
  }

  editDeploymentTime(worfklowVersion: WorkflowVersion) {
    this.dialog
      .open(DeployScheduleComponent, {
        minWidth: `450px`,
        autoFocus: false,
        data: { workflowVersion: worfklowVersion }
      })
      .afterClosed()
      .subscribe((workflowVersion: WorkflowVersion) => {
        console.log(workflowVersion);
        if (workflowVersion && workflowVersion instanceof WorkflowVersion) {
          this.dialogRef.close(workflowVersion);
        }
      });
  }
}
