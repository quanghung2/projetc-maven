import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SourceService, User, Workflow, WorkflowService } from '@b3networks/api/ivr';
import { FindSubscriptionReq, SubscriptionService } from '@b3networks/api/subscription';
import { APP_IDS } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface SelectWorkflowData {
  workflows: Workflow[];
  selectingWorkflow: Workflow;
  user: User;
}

@Component({
  selector: 'b3n-select-workflow-dialog',
  templateUrl: './select-workflow-dialog.component.html',
  styleUrls: ['./select-workflow-dialog.component.scss']
})
export class SelectWorkflowDialogComponent implements OnInit {
  readonly displayedColumns = ['label', 'numbers', 'updatedAt'];
  workflows: Workflow[];
  sourceCount: number;

  selectedWorkflow: Workflow;
  user: User;

  constructor(
    private dialogRef: MatDialogRef<SelectWorkflowDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: SelectWorkflowData,
    private workflowService: WorkflowService,
    private sourceService: SourceService,
    private spinner: LoadingSpinnerSerivce,
    private subscriptionService: SubscriptionService,
    private toastService: ToastService
  ) {
    this.workflows = data.workflows;
    this.selectedWorkflow = data.selectingWorkflow;
    this.user = data.user;
  }

  ngOnInit() {
    if (!this.workflows) {
      this.spinner.showSpinner();
      const findSubReq = new FindSubscriptionReq();
      findSubReq.productIds = [APP_IDS.VIRTUAL_LINE];
      findSubReq.assignee = this.user.uuid;

      forkJoin([
        this.workflowService.findWorkflows(),
        this.sourceService.fetchIvrSources(),
        this.subscriptionService.findSubscriptions(findSubReq)
      ])
        .pipe(finalize(() => this.spinner.hideSpinner()))
        .subscribe(
          data => {
            this.workflows = data[0];
            const unAssignWorkflow = this.workflows.filter(workflow => workflow.numbers.length === 0);
            this.sourceCount = data[1].length;

            const assignedSubscriptions = data[2].data;
            this.workflows = this.workflows.filter(w =>
              assignedSubscriptions.find(sub => sub.uuid === w.subscriptionUuid)
            );
            this.workflows = this.workflows.concat(unAssignWorkflow);
          },
          error => {
            this.toastService.error(error.message);
            this.dialogRef.close();
          }
        );
    }
  }

  toggleSelected(workflow: Workflow) {
    this.selectedWorkflow = workflow;
  }

  create() {
    this.dialogRef.close({ createNewOne: true });
  }

  confirm() {
    this.dialogRef.close(this.selectedWorkflow);
  }
}
