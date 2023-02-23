import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityProfileQuery, ProfileOrg } from '@b3networks/api/auth';
import { ActionType, Workflow, WorkflowService, WorkflowStatus, WorkflowVersion } from '@b3networks/api/ivr';
import {
  StoreWorkflowComponent,
  StoreWorkflowInput,
  VersionHistoryComponent,
  VersionHistoryInput
} from '@b3networks/comms/ivr/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-auto-attendant',
  templateUrl: './auto-attendant.component.html',
  styleUrls: ['./auto-attendant.component.scss']
})
export class AutoAttendantComponent extends DestroySubscriberComponent implements OnInit {
  readonly WorkflowStatus = WorkflowStatus;
  readonly displayedColumns = ['name', 'numbers', 'deployment_time', 'actions'];

  dataSource = new MatTableDataSource<Workflow>();

  isLoading: boolean;

  pendingScheduleWorkflowVersions: WorkflowVersion[];
  profileOrg: ProfileOrg;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private workflowService: WorkflowService,
    private identityProfileQuery: IdentityProfileQuery,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.identityProfileQuery.currentOrg$
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(value => (this.profileOrg = value));
    this.getData();
  }

  getData() {
    this.isLoading = true;
    this.workflowService
      .findWorkflows()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(result => {
        this.dataSource.data = result.sort();
        this.dataSource.paginator = this.paginator;
      });
  }

  showDetails(item: Workflow) {
    this.router.navigate([item.uuid, 'config', { uuid: item.uuid }], { relativeTo: this.route });
  }

  editName(flow: Workflow) {
    this.dialog
      .open(StoreWorkflowComponent, {
        width: '500px',
        data: <StoreWorkflowInput>{
          workflow: flow,
          type: ActionType.rename,
          updateLabelOnly: true
        }
      })
      .afterClosed()
      .subscribe(data => {
        if (data && data instanceof Workflow) {
          this.getData();
        }
      });
  }

  showVersions(workflow: Workflow) {
    const dialogRef = this.dialog.open(VersionHistoryComponent, {
      minWidth: `800px`,
      minHeight: `350px`,
      data: <VersionHistoryInput>{ workflow: workflow, isAdmin: this.profileOrg.isUpperAdmin }
    });
    dialogRef.afterClosed().subscribe(wv => {
      if (wv && wv instanceof WorkflowVersion) {
        workflow.scheduledAt = wv.scheduledAt ? wv.scheduledAt : workflow.scheduledAt;
      }
      this.router.navigate([wv.workFlowUuid, 'config', { uuid: wv.workFlowUuid, version: wv.version }], {
        relativeTo: this.route
      });
    });
  }

  routingNewVersion(uuid: string) {
    const newWorkflowVersion: WorkflowVersion = this.pendingScheduleWorkflowVersions.find(
      workflowVersion => workflowVersion.workFlowUuid === uuid
    );
    if (newWorkflowVersion) {
      this.router.navigate(
        [
          newWorkflowVersion.workFlowUuid,
          'config',
          { uuid: newWorkflowVersion.workFlowUuid, version: newWorkflowVersion.version }
        ],
        { relativeTo: this.route }
      );
    }
  }
}
