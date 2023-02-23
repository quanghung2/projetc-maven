import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Workflow, WorkflowQuery, WorkflowService } from '@b3networks/api/ivr';
import { StoreWorkflowComponent, StoreWorkflowInput } from '@b3networks/comms/ivr/shared';
import { PERMISSION_VALUE } from './sidebar/sidebar.component';

@Component({
  selector: 'b3n-attendant',
  templateUrl: './attendant.component.html',
  styleUrls: ['./attendant.component.scss']
})
export class AttendantComponent implements OnInit {
  selectedWorkflow: Workflow;

  isDisplayToolbar = true;
  activatedMenu = 'Configuration';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
    private workflowQuery: WorkflowQuery,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.workflowService.findWorkflows().subscribe(list => {
      this.workflowService.setActive(list[0].uuid);
    });

    this.workflowQuery.selectActiveId().subscribe(id => {
      if (!!id) {
        this.selectedWorkflow = this.workflowQuery.getActive();
        this.router.navigate(['config', { uuid: id }], { relativeTo: this.route });
        this.activatedMenu = 'Configuration';
      }
    });
  }

  onWorkflowChanged(w?: Workflow) {
    if (w) {
      this.router.navigate(['config', { uuid: w.uuid }], { relativeTo: this.route });
      this.activatedMenu = 'Configuration';
    }
  }

  onMenuChanged(m: string) {
    this.activatedMenu = m;
    this.isDisplayToolbar = !(m === PERMISSION_VALUE);
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
