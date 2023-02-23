import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Flow, FlowService, TriggerService } from '@b3networks/api/flow';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { CollapseWorking, GroupBy } from '../list-flow.component';

@Component({
  selector: 'b3n-table-flow',
  templateUrl: './table-flow.component.html',
  styleUrls: ['./table-flow.component.scss']
})
export class TableFlowComponent implements AfterViewInit, OnChanges {
  @Input() flows: (Flow | GroupBy)[];
  @Input() paging = false;
  @Output() showAll: EventEmitter<CollapseWorking> = new EventEmitter<CollapseWorking>();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource: MatTableDataSource<Flow | GroupBy>;
  displayedColumns: string[] = ['name', 'version', 'lastUpdated', 'deprecated'];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: ToastService,
    private dialog: MatDialog,
    private flowService: FlowService,
    private triggerService: TriggerService
  ) {}

  ngOnChanges(): void {
    this.dataSource = new MatTableDataSource<Flow | GroupBy>(this.flows);
  }

  ngAfterViewInit() {
    if (this.paging) {
      this.dataSource.paginator = this.paginator;
    }
  }

  isGroup(index, item: GroupBy): boolean {
    return item.isGroupBy;
  }

  collapse(e: GroupBy) {
    switch (e.type) {
      case 'Draft': {
        const showAllActive = <GroupBy>this.flows.find(f => f.type === 'Active');
        this.showAll.emit({
          showFullDraft: e.showFullList,
          showFullActive: showAllActive ? !showAllActive.showFullList : false
        });
        break;
      }
      case 'Active': {
        const showAllDraft = <GroupBy>this.flows.find(f => f.type === 'Draft');
        this.showAll.emit({
          showFullDraft: showAllDraft ? !showAllDraft.showFullList : false,
          showFullActive: e.showFullList
        });
        break;
      }
    }
  }

  viewFlow(flow: Flow) {
    this.flowService.getFlowDetail({ flowUuid: flow.uuid, version: flow.version }).subscribe(() => {
      this.router.navigate([flow.uuid, flow.version], { relativeTo: this.activatedRoute.parent });
    });
  }

  copied() {
    this.toastr.success('Copied to clipboard');
  }

  onNavigateToResoleDeprecate(flow: Flow) {
    if (!flow.editable) {
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '500px',
          panelClass: 'fif-dialog',
          data: <ConfirmDialogInput>{
            title: 'Resolve Issues',
            message: `You must create a new version of this flow. Do you want to create a new version of this flow?<br/><br/>
                  <strong>*Note:</strong> The current version will continue running until the new one is activated`,
            color: 'warn'
          }
        })
        .afterClosed()
        .subscribe(confirm => {
          if (confirm) {
            this.flowService.createNewVersion({ flowUuid: flow.uuid, version: flow.version }).subscribe({
              next: newFlow => {
                this.triggerService.getTrigger(newFlow.uuid, newFlow.version).subscribe(() => {
                  this.toastr.success(`A new version of the flow has been created`);
                  this.router.navigate([newFlow.uuid, newFlow.version, 'resolve-deprecated'], {
                    relativeTo: this.activatedRoute.parent
                  });
                });
              },
              error: error => this.toastr.error(error.message)
            });
          }
        });
    } else {
      this.triggerService.getTrigger(flow.uuid, flow.version).subscribe(() => {
        this.router.navigate([flow.uuid, flow.version, 'resolve-deprecated'], {
          relativeTo: this.activatedRoute.parent
        });
      });
    }
  }
}
