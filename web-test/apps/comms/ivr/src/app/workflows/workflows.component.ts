import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ActionType,
  User,
  UserService,
  Workflow,
  WorkflowService,
  WorkflowStatus,
  WorkflowVersion
} from '@b3networks/api/ivr';
import { FindSubscriptionReq, Subscription, SubscriptionService } from '@b3networks/api/subscription';
import {
  StoreWorkflowComponent,
  StoreWorkflowInput,
  VersionHistoryComponent,
  VersionHistoryInput
} from '@b3networks/comms/ivr/shared';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Component({
  selector: 'b3n-workflows',
  templateUrl: './workflows.component.html',
  styleUrls: ['./workflows.component.scss']
})
export class WorkflowsComponent implements OnInit {
  readonly displayedColumns: string[] = ['label', 'subscription', 'enableCallRecording', 'updatedAt', 'actions'];
  readonly WorkflowStatus = WorkflowStatus;
  readonly ActionType = ActionType;
  workflows: Workflow[];

  searchNumber: string;
  searching: boolean;
  backupData: Workflow[];
  type: ActionType;
  pendingScheduleWorkflowVersions: WorkflowVersion[];
  user: User;
  assignedSubscriptions: Subscription[] = [];
  subscriptionMaping: { [Tkey in string]: Subscription } = {};

  constructor(
    private route: ActivatedRoute,
    private subscriptionService: SubscriptionService,
    private workflowService: WorkflowService,
    private spinner: LoadingSpinnerSerivce,
    private router: Router,
    private dialog: MatDialog,
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.spinner.showSpinner();

    this.userService
      .fetchUser()
      .pipe(finalize(() => this.spinner.hideSpinner()))
      .subscribe(user => {
        this.user = user;

        this.initData();
      });
  }
  initData() {
    this.spinner.showSpinner();

    const findSubReq = new FindSubscriptionReq();
    findSubReq.productIds = [environment.appId];
    findSubReq.assignee = this.user.uuid;
    findSubReq.embed = ['numbers'];

    forkJoin([
      this.subscriptionService.findSubscriptions(findSubReq, { page: 1, perPage: 1000 }),
      this.workflowService.findWorkflows(),
      this.workflowService.getAllPendingScheduleVersion()
    ])
      .pipe(finalize(() => this.spinner.hideSpinner()))
      .subscribe(
        data => {
          this.subscriptionMaping = data[0].data.reduce(function (map, subscription) {
            map[subscription.uuid] = subscription;
            return map;
          }, {});

          this.workflows = data[1];

          const unAssignWorkflow: Workflow[] = this.workflows.filter(workflow => workflow.numbers.length === 0);
          this.pendingScheduleWorkflowVersions = data[2];

          this.assignedSubscriptions = data[0].data;
          this.workflows = this.workflows.filter(workflow =>
            this.assignedSubscriptions.find(sub => sub.uuid == workflow.subscriptionUuid)
          );
          this.workflows = this.workflows.concat(unAssignWorkflow);
          this.backupData = this.workflows;
          this.backupData.forEach(w => {
            this.pendingScheduleWorkflowVersions.forEach(wv => {
              if (w.uuid === wv.workFlowUuid) {
                wv.name = w.label;
              }
            });
          });
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  configWorkflow(workflow: Workflow) {
    this.spinner.showSpinner();
    this.router.navigate([workflow.uuid], {
      relativeTo: this.route
    });
  }

  storeWorkflow(workflow?: Workflow, type?: string) {
    if (!workflow) {
      type = 'create';
    }
    this.dialog
      .open(StoreWorkflowComponent, {
        width: '500px',
        data: <StoreWorkflowInput>{
          workflow: workflow,
          type: type,
          updateLabelOnly: type === 'rename' ? true : false,
          assignedSubscriptions: this.assignedSubscriptions
        }
      })
      .afterClosed()
      .subscribe(data => {
        if (data && data instanceof Workflow) {
          this.fetchWorkflows();
        }
      });
  }

  delete(workflow: Workflow) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete flow',
          message: `Are you sure to delete this flow? All assigned numbers to this flow will be released.`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.workflowService.deleteWorkflow(workflow.uuid).subscribe(result => {
            this.fetchWorkflows();
          });
        }
      });
  }

  search() {
    this.spinner.showSpinner();
    if (this.searchNumber) {
      this.searchNumber = this.searchNumber.trim();
      this.searching = true;
    }
    if (this.searchNumber && !this.searchNumber.includes('+')) {
      this.searchNumber = '+' + this.searchNumber;
    }
    this.workflowService
      .searchNumber(this.searchNumber)
      .pipe(finalize(() => this.spinner.hideSpinner()))
      .subscribe(
        (data: Workflow[]) => {
          if (data.length > 0) {
            this.workflows = data.filter(item => this.backupData.find(w => w.uuid === item.uuid));
          }
          if (this.searchNumber && data.length === 0) {
            this.workflows = this.backupData;
            this.toastService.error('No number found!', 3000);
            this.searching = false;
          }
        },
        error => this.toastService.error(error.message)
      );
  }

  cancelSearch() {
    this.searchNumber = '';
    this.search();
    setTimeout(() => {
      this.searching = false;
    }, 0);
  }

  fetchWorkflows() {
    this.spinner.showSpinner();
    this.workflowService
      .findWorkflows()
      .pipe(finalize(() => this.spinner.hideSpinner()))
      .subscribe(workflows => {
        this.workflows = workflows;
        const unAssignWorkflow = this.workflows.filter(workflow => workflow.numbers.length === 0);
        this.workflows = this.workflows.filter(workflow =>
          this.assignedSubscriptions.find(sub => sub.uuid === workflow.subscriptionUuid)
        );
        this.workflows = this.workflows.concat(unAssignWorkflow);
        this.backupData = this.workflows;
      });
  }

  openVersionHistoryDialog(workflow: Workflow) {
    const dialogRef = this.dialog.open(VersionHistoryComponent, {
      minWidth: `800px`,
      minHeight: `350px`,
      data: <VersionHistoryInput>{ workflow: workflow, isAdmin: this.user.isAdmin }
    });
    dialogRef.afterClosed().subscribe(wv => {
      if (wv && wv instanceof WorkflowVersion) {
        workflow.scheduledAt = wv.scheduledAt ? wv.scheduledAt : workflow.scheduledAt;
        this.router.navigate([wv.workFlowUuid, 'config', { uuid: wv.workFlowUuid, version: wv.version }], {
          relativeTo: this.route
        });
      }
    });
  }

  routingNewVersion(uuid: string) {
    const newWorkflowVersion: WorkflowVersion = this.pendingScheduleWorkflowVersions.find(
      workflowVersion => workflowVersion.workFlowUuid === uuid
    );
    this.router.navigate([`workflows/${newWorkflowVersion.workFlowUuid}/${newWorkflowVersion.version}`]);
  }
}
