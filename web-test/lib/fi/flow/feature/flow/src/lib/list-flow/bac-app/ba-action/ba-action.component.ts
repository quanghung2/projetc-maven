import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Page, Pageable } from '@b3networks/api/common';
import { BaCreatorService, FlowActionReq, FlowService, SimpleFlow } from '@b3networks/api/flow';
import {
  DeleteFlowDialogComponent,
  RenameFlowDialogComponent,
  RenameFlowDialogReq,
  Utils,
  ValidateStringMaxLength
} from '@b3networks/fi/flow/shared';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { debounceTime, finalize, startWith } from 'rxjs/operators';

@Component({
  selector: 'b3n-ba-action',
  templateUrl: './ba-action.component.html',
  styleUrls: ['./ba-action.component.scss']
})
export class BaActionComponent implements OnInit {
  loading: boolean;
  creating: boolean;
  deleting: boolean;
  pageable = <Pageable>{ page: 0, perPage: 10 };
  flowsPage: Page<SimpleFlow>;
  displayedColumns: string[] = ['uuid', 'name', 'mappedTriggerNames', 'activeLastUpdatedAt', 'deprecated', 'actions'];

  keywordCtrl = new UntypedFormControl(
    '',
    Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
  );
  getErrorKeyword() {
    return Utils.getErrorInput(this.keywordCtrl);
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private flowService: FlowService,
    private baCreatorService: BaCreatorService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    this.router.navigate([this.router.url.split('?')[0]]);
    this.keywordCtrl.valueChanges.pipe(debounceTime(300), startWith('')).subscribe(() => {
      this.getBacFlows();
    });
  }

  private getBacFlows() {
    this.loading = true;
    this.baCreatorService
      .getBusinessAction(this.pageable, this.keywordCtrl.valid ? this.keywordCtrl.value : '')
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(res => {
        this.flowsPage = res;
      });
  }

  copied() {
    this.toastr.success('Copied to clipboard');
  }

  changePage(page?: number) {
    this.pageable.page = page;
    this.getBacFlows();
  }

  createFlow() {
    this.creating = true;
    this.baCreatorService
      .createFlow()
      .pipe(finalize(() => (this.creating = false)))
      .subscribe({
        next: flow => {
          this.toastr.success('Flow has been created');
          this.router.navigate(['../flow', flow.uuid, flow.version], { relativeTo: this.route.parent });
        },
        error: err => this.toastr.error(err.message)
      });
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
        autoFocus: true,
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
          this.getBacFlows();
        }
      });
  }

  delete(flow: SimpleFlow) {
    if (flow.activeVersion && flow.draftVersion) {
      this.dialog
        .open(DeleteFlowDialogComponent, {
          width: '400px',
          disableClose: true,
          autoFocus: false,
          panelClass: 'fif-dialog',
          data: flow
        })
        .afterClosed()
        .subscribe(res => {
          if (res) {
            this.getBacFlows();
          }
        });
    } else {
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '400px',
          disableClose: true,
          panelClass: 'fif-dialog',
          data: <ConfirmDialogInput>{
            title: 'Delete flow',
            message: `Are you sure you want to delete flow <strong>${flow.name} (${flow.uuid.substring(
              0,
              8
            )})</strong>?`,
            color: 'warn'
          }
        })
        .afterClosed()
        .subscribe(confirmed => {
          if (confirmed) {
            this.deleting = true;
            this.flowService
              .archiveFlow(<FlowActionReq>{
                flowUuid: flow.uuid,
                version: flow.activeVersion ? flow.activeVersion : flow.draftVersion
              })
              .pipe(finalize(() => (this.deleting = false)))
              .subscribe({
                next: () => {
                  this.toastr.success(`Flow has been deleted`);
                  this.getBacFlows();
                },
                error: err => this.toastr.error(`Delete failed: ${err.message}`)
              });
          }
        });
    }
  }
}
