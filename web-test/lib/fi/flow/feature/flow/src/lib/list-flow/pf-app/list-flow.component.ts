import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Page, Pageable } from '@b3networks/api/common';
import {
  CreateFlowReq,
  FlowService,
  ImportFlowReq,
  Project,
  ProjectQuery,
  ProjectService,
  SimpleFlow,
  TriggerDefService,
  TriggerService,
  UserQuery
} from '@b3networks/api/flow';
import {
  AppName,
  DeleteFlowDialogComponent,
  RenameFlowDialogComponent,
  RenameFlowDialogReq
} from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { filter, finalize, take, takeUntil } from 'rxjs/operators';
import { ImportFlowDialogComponent, ImportFlowDialogRes } from '../import-flow-dialog/import-flow-dialog.component';

@Component({
  selector: 'b3n-pf-app',
  templateUrl: './list-flow.component.html',
  styleUrls: ['./list-flow.component.scss']
})
export class PfListFlowComponent extends DestroySubscriberComponent implements OnInit {
  project: Project;
  creating: boolean;
  loading: boolean;
  deleting: boolean;
  uploading: boolean;
  dataSource: MatTableDataSource<SimpleFlow>;
  flowsPage: Page<SimpleFlow>;
  pageable: Pageable = { page: 0, perPage: 10 };
  displayedColumns: string[] = ['uuid', 'name', 'activeLastUpdatedAt', 'deprecated', 'actions'];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastService,
    private dialog: MatDialog,
    private projectService: ProjectService,
    private projectQuery: ProjectQuery,
    private triggerDefService: TriggerDefService,
    private triggerService: TriggerService,
    private flowService: FlowService,
    private userQuery: UserQuery
  ) {
    super();
  }

  ngOnInit() {
    this.projectQuery
      .selectActive()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(project => !!project),
        take(1)
      )
      .subscribe(project => {
        this.project = project;
        this.getFlows();
        this.triggerDefService.getAllTriggerDef(this.project.uuid, '').subscribe();
      });
  }

  private checkLimitResource(): boolean {
    const flowsPerProjectLimit = this.userQuery.getValue().flowsPerProjectLimit;
    if (!flowsPerProjectLimit) {
      return true;
    } else {
      if (this.flowsPage.totalCount > flowsPerProjectLimit) {
        this.dialog.open(ConfirmDialogComponent, {
          width: '500px',
          data: <ConfirmDialogInput>{
            title: `Unable to add flow. Limit exceeded`,
            message: `You have exceeded the maximum ${flowsPerProjectLimit} flows per project limit. Please remove some other flows to proceed.`,
            confirmLabel: 'Close',
            color: 'primary',
            hideCancel: true
          }
        });
        return false;
      } else {
        return true;
      }
    }
  }

  createFlow() {
    if (this.checkLimitResource()) {
      this.creating = true;
      this.flowService
        .createFlow(<CreateFlowReq>{ name: null, type: 'NORMAL', projectUuid: this.project.uuid }, true)
        .pipe(finalize(() => (this.creating = false)))
        .subscribe({
          next: flow => {
            this.toastr.success('Flow has been created');
            this.router.navigate(['../flow', flow.uuid, flow.version], { relativeTo: this.route.parent });
          },
          error: error => {
            this.toastr.error(error.message);
          }
        });
    }
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
            appOrigin: AppName.PROGRAMMABLE_FLOW,
            projectUuid: this.project.uuid
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
                        this.flowService.getFlowDetail({ flowUuid: flow.uuid, version: flow.version }).subscribe(() => {
                          this.router.navigate(['../flow', flow.uuid, flow.version], { relativeTo: this.route.parent });
                        });
                        break;
                      case 'resolve':
                        this.triggerService.getTrigger(flow.uuid, flow.version).subscribe(() => {
                          this.router.navigate(['../flow', flow.uuid, flow.version, 'resolve-deprecated'], {
                            relativeTo: this.route.parent
                          });
                        });
                        break;
                      default:
                        this.getFlows();
                        break;
                    }
                  });
              },
              error: err => this.toastr.error(err.message)
            });
        };
        reader.onerror = () => {
          this.toastr.error('Unable to read ' + uploadedFile.fileName);
        };
      } catch (error) {
        this.toastr.error('Error');
        this.uploading = false;
      }
    }
  }

  private getFlows() {
    this.loading = true;
    this.projectService
      .getFlowsOfProject(this.project.uuid, this.pageable)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(flowsPage => {
        this.flowsPage = flowsPage;
        this.dataSource = new MatTableDataSource<SimpleFlow>(this.flowsPage.content);
      });
  }

  changePage(page?: number) {
    this.pageable.page = page;
    this.getFlows();
  }

  copied() {
    this.toastr.success('Copied to clipboard');
  }

  viewFlow(flow: SimpleFlow) {
    const version = flow.activeVersion ? flow.activeVersion : flow.draftVersion;
    this.flowService.getFlowDetail({ flowUuid: flow.uuid, version: version }).subscribe(() => {
      this.router.navigate(['../flow', flow.uuid, version], { relativeTo: this.route.parent });
    });
  }

  rename(flow: SimpleFlow) {
    this.dialog
      .open(RenameFlowDialogComponent, {
        width: '400px',
        panelClass: 'fif-dialog',
        disableClose: true,
        data: <RenameFlowDialogReq>{
          uuid: flow.uuid,
          version: flow.draftVersion,
          name: flow.name,
          type: flow.type,
          presentName: flow.presentName
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.getFlows();
        }
      });
  }

  delete(flow: SimpleFlow) {
    this.dialog
      .open(DeleteFlowDialogComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: false,
        panelClass: 'fif-dialog',
        data: flow
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.getFlows();
        }
      });
  }
}
