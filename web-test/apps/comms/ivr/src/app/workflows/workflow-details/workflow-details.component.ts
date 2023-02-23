import { KeyValue } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { User, UserService, Workflow, WorkflowService } from '@b3networks/api/ivr';
import { FindSubscriptionReq, SubscriptionService } from '@b3networks/api/subscription';
import {
  SelectWorkflowData,
  SelectWorkflowDialogComponent,
  StoreWorkflowComponent,
  StoreWorkflowInput
} from '@b3networks/comms/ivr/shared';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'b3n-workflow-details',
  templateUrl: './workflow-details.component.html',
  styleUrls: ['./workflow-details.component.scss']
})
export class WorkflowDetailsComponent implements OnInit, OnDestroy {
  readonly tabs: KeyValue<string, string>[] = [
    { key: 'config', value: 'Configuration' },
    { key: 'blacklist', value: 'Blacklist' },
    { key: 'history', value: 'History' },
    { key: 'integration', value: 'Integration' },
    { key: 'notification', value: 'Settings' }
  ];

  worfklowUuid: string;
  selectedWorkflow: Workflow;
  workflows: Workflow[] = [];
  user: User;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
    private dialog: MatDialog,
    private spinner: LoadingSpinnerSerivce,
    private subscriptionService: SubscriptionService,
    private userService: UserService,
    private toastService: ToastService
  ) {
    this.router.events.pipe(filter(evt => evt instanceof NavigationEnd)).subscribe(_ => {
      if (!this.route.firstChild) {
        this.router.navigate(['config', { ...this.route.snapshot.params }], { relativeTo: this.route });
      }
    });
  }

  ngOnInit() {
    this.userService.fetchUser().subscribe(user => {
      this.user = user;
      this.route.params
        .pipe(
          mergeMap(params => {
            this.worfklowUuid = params['uuid'];
            const findSubReq = new FindSubscriptionReq();
            findSubReq.productIds = [environment.appId];
            findSubReq.assignee = this.user.uuid;
            return forkJoin([
              this.workflowService.findWorkflows(),
              this.subscriptionService.findSubscriptions(findSubReq)
            ]);
          })
        )
        .subscribe(
          data => {
            this.workflows = data[0];
            const unAssignWorkflow = this.workflows.filter(workflow => workflow.numbers.length === 0);
            this.selectedWorkflow = this.workflows.find(w => w.uuid === this.worfklowUuid);

            const assignedSubscriptions = data[1].data;
            this.workflows = this.workflows.filter(w =>
              assignedSubscriptions.find(sub => sub.uuid === w.subscriptionUuid)
            );
            this.workflows = this.workflows.concat(unAssignWorkflow);
            this.spinner.hideSpinner();
          },
          error => {
            this.toastService.error(error.message);
            this.spinner.hideSpinner();
          }
        );
    });
  }

  ngOnDestroy() {}

  viewAllNumbers() {
    this.dialog
      .open(SelectWorkflowDialogComponent, {
        data: <SelectWorkflowData>{ selectingWorkflow: this.selectedWorkflow, user: this.user },
        minWidth: '660px'
      })
      .afterClosed()
      .subscribe(data => {
        if (data && data instanceof Workflow) {
          this.router.navigate(['workflows', data.uuid]);
        }
      });
  }

  routingSelectedWorkflow(workflow: Workflow) {
    this.router.navigate(['workflows', workflow.uuid]);
  }

  updateLabel() {
    this.dialog
      .open(StoreWorkflowComponent, {
        data: <StoreWorkflowInput>{
          workflow: this.selectedWorkflow,
          type: 'rename'
        },
        minWidth: '400px'
      })
      .afterClosed()
      .subscribe(workflow => {
        if (workflow && workflow instanceof Workflow) {
          this.selectedWorkflow.label = workflow.label;
        }
      });
  }
}
