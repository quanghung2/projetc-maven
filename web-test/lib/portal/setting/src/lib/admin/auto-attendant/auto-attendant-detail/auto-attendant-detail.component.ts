import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Workflow, WorkflowService } from '@b3networks/api/ivr';
import { StoreWorkflowComponent, StoreWorkflowInput } from '@b3networks/comms/ivr/shared';
import { filter } from 'rxjs/operators';
import { ADMIN_LINK } from '../../../shared/contants';

@Component({
  selector: 'b3n-auto-attendant-detail',
  templateUrl: './auto-attendant-detail.component.html',
  styleUrls: ['./auto-attendant-detail.component.scss']
})
export class AutoAttendantDetailComponent implements OnInit {
  readonly links: KeyValue<string, string>[] = [
    { key: 'config', value: 'Configuration' },
    { key: 'blacklist', value: 'Blacklist' },
    { key: 'worktime', value: 'Work Time' }
  ];
  readonly AUTO_ATTENDANT_LINK = ADMIN_LINK.autoAttendant;

  uuid: string;
  selectedWorkflow: Workflow;
  workflows: Workflow[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
    private dialog: MatDialog
  ) {
    this.router.events.pipe(filter(evt => evt instanceof NavigationEnd)).subscribe(_ => {
      if (!this.route.firstChild) {
        this.router.navigate(['config', { ...this.route.snapshot.params }], { relativeTo: this.route });
      }
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.log(params);

      this.uuid = params['uuid'];
      this.workflowService.findWorkflows().subscribe(workflows => {
        this.workflows = workflows;
        this.selectedWorkflow = this.workflows.find(w => w.uuid === this.uuid);
      });
    });
  }

  viewAllNumbers() {
    // this.dialog
    //   .open(SelectWorkflowDialogComponent, {
    //     data: <SelectWorkflowData>{ selectingWorkflow: this.selectedWorkflow, user: this.user },
    //     minWidth: '660px'
    //   })
    //   .afterClosed()
    //   .subscribe(data => {
    //     if (data && data instanceof Workflow) {
    //       this.router.navigate(['workflows', data.uuid]);
    //     }
    //   });
  }

  routingSelectedWorkflow(workflow: Workflow) {
    this.router.navigate([workflow.uuid, 'config', { uuid: workflow.uuid }], { relativeTo: this.route.parent });
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

  back() {
    this.router.navigate(['.'], { relativeTo: this.route.parent });
  }
}
