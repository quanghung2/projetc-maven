import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Flow, FlowService, ImportFlowReq, TriggerService } from '@b3networks/api/flow';
import { AppName } from '@b3networks/fi/flow/shared';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, tap } from 'rxjs/operators';
import { ImportFlowDialogComponent, ImportFlowDialogRes } from '../import-flow-dialog/import-flow-dialog.component';
import { CreateFlowDialogComponent } from './create-flow-dialog/create-flow-dialog.component';

export interface GroupBy {
  groupName: string;
  isGroupBy: boolean;
  title: string;
  type: 'Draft' | 'Active';
  showFullList: boolean;
}

export interface CollapseWorking {
  showFullDraft: boolean;
  showFullActive: boolean;
}

@Component({
  selector: 'b3n-flow-app',
  templateUrl: './list-flow.component.html',
  styleUrls: ['./list-flow.component.scss']
})
export class FifListFlowComponent implements OnInit {
  showSetting: boolean;
  readonly showMoreSize = 5;
  showWorking: boolean;
  loadingWorking: boolean;
  showArchived: boolean;
  loadingArchived: boolean;
  draftFlows: (Flow | GroupBy)[];
  activeFlows: (Flow | GroupBy)[];
  workingFlows: (Flow | GroupBy)[];
  archivedFlows: Flow[];
  uploading: boolean;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private triggerService: TriggerService,
    private flowService: FlowService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const orgAllowSetting: string[] = [
      '9b311930-2c04-4e49-9c8f-b745807dc64c',
      'fc312420-0047-49a7-94a8-003f11f115c0',
      '9d336117-63e5-412e-96ca-fa5f5627b4ac',
      '8cd9e7d4-71ae-4600-9444-56df0ce4f835',
      '3c455e52-00be-4bc9-b9ba-b44ead2e97c1'
    ];
    this.showSetting = orgAllowSetting.indexOf(X.orgUuid) != -1;

    switch (this.route.snapshot.queryParamMap.get('tab')) {
      case 'archived':
        this.showArchived = true;
        this.loadArchivedFlows();
        break;
      default:
        this.showWorking = true;
        this.loadWorkingFlows({ showFullDraft: false, showFullActive: false });
        break;
    }
    this.router.navigate([this.router.url.split('?')[0]]);
  }

  tabChange(index: number) {
    switch (index) {
      case 0:
        this.showWorking = true;
        this.showArchived = false;
        this.workingFlows = null;
        this.loadWorkingFlows({ showFullDraft: false, showFullActive: false });
        break;
      case 1:
        this.showWorking = false;
        this.showArchived = true;
        this.loadArchivedFlows();
        break;
    }
  }

  loadWorkingFlows(show: CollapseWorking) {
    if (!this.workingFlows) {
      this.loadingWorking = true;
      this.workingFlows = [];
      this.flowService
        .getFlows(false)
        .pipe(
          finalize(() => (this.loadingWorking = false)),
          tap(flows => {
            this.draftFlows = flows.filter(f => !f.isActive);
            this.workingFlows = this.workingFlows.concat(
              this.processList(this.draftFlows, 'Draft', show.showFullDraft, this.showMoreSize)
            );

            this.activeFlows = flows.filter(f => f.isActive);
            this.workingFlows = this.workingFlows.concat(
              this.processList(this.activeFlows, 'Active', show.showFullActive, this.showMoreSize)
            );
          })
        )
        .subscribe();
    } else {
      this.workingFlows.length = 0;
      this.workingFlows = this.workingFlows.concat(
        this.processList(this.draftFlows, 'Draft', show.showFullDraft, this.showMoreSize)
      );
      this.workingFlows = this.workingFlows.concat(
        this.processList(this.activeFlows, 'Active', show.showFullActive, this.showMoreSize)
      );
    }
  }

  loadArchivedFlows() {
    this.loadingArchived = true;
    this.flowService
      .getFlows(true)
      .pipe(
        finalize(() => (this.loadingArchived = false)),
        tap(flows => {
          this.archivedFlows = flows;
        })
      )
      .subscribe();
  }

  private processList(
    list: (Flow | GroupBy)[],
    title: string,
    showFull: boolean,
    showMoreSize: number
  ): (Flow | GroupBy)[] {
    let resultList: (Flow | GroupBy)[] = [];
    if (list.length > 0) {
      resultList.push(<GroupBy>{
        groupName: `${title} (${list.length})`,
        isGroupBy: true,
        type: title
      });
      if (!showFull) {
        if (list.length > showMoreSize) {
          resultList = resultList.concat(list.slice(0, showMoreSize));
          resultList[0] = <GroupBy>{
            groupName: `${title} (${list.length})`,
            isGroupBy: true,
            title: 'Show all',
            type: title,
            showFullList: true
          };
        } else {
          resultList = resultList.concat(list);
        }
      } else {
        if (list.length > showMoreSize) {
          resultList = resultList.concat(list);
          resultList[0] = <GroupBy>{
            groupName: `${title} (${list.length})`,
            isGroupBy: true,
            title: 'Show less',
            type: title,
            showFullList: false
          };
        } else {
          resultList = resultList.concat(list);
        }
      }
    }
    return resultList;
  }

  createFlow() {
    this.dialog
      .open(CreateFlowDialogComponent, {
        width: '400px',
        panelClass: 'fif-dialog',
        disableClose: true
      })
      .afterClosed()
      .subscribe((flow: Flow) => {
        if (flow) {
          this.router.navigate([flow.uuid, flow.version], { relativeTo: this.route.parent });
        }
      });
  }

  importFlow(event) {
    if (event.target.files.length > 0) {
      const uploadedFile = event.target.files[0];
      this.uploading = true;
      try {
        const reader = new FileReader();
        reader.readAsText(uploadedFile);
        reader.onload = () => {
          const importData = JSON.parse(reader.result as string);
          const req: ImportFlowReq = {
            checksum: importData.checksum,
            data: importData.data,
            appOrigin: AppName.FLOW
          };

          this.flowService
            .importFlow(req)
            .pipe(finalize(() => (this.uploading = false)))
            .subscribe({
              next: flow => {
                this.dialog
                  .open(ImportFlowDialogComponent, {
                    width: '400px',
                    panelClass: 'fif-dialog',
                    disableClose: true,
                    autoFocus: false,
                    data: flow
                  })
                  .afterClosed()
                  .subscribe((res: ImportFlowDialogRes) => {
                    switch (res.action) {
                      case 'view':
                        this.router.navigate([flow.uuid, flow.version], {
                          relativeTo: this.route.parent
                        });
                        break;
                      case 'resolve':
                        this.triggerService.getTrigger(flow.uuid, flow.version).subscribe(() => {
                          this.router.navigate([flow.uuid, flow.version, 'resolve-deprecated'], {
                            relativeTo: this.route.parent
                          });
                        });
                        break;
                      default:
                        this.workingFlows = null;
                        this.loadWorkingFlows({ showFullDraft: false, showFullActive: false });
                        break;
                    }
                  });
              },
              error: err => this.toastService.error(err.message)
            });
        };
        reader.onerror = () => {
          this.toastService.error('Unable to read ' + uploadedFile.fileName);
        };
      } catch (error) {
        this.toastService.error('Error');
        this.uploading = false;
      }
    }
  }

  goToSetting() {
    this.router.navigate(['../setting'], { relativeTo: this.route });
  }
}
