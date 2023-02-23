import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  ComplianceAction,
  Extension,
  ExtensionService,
  EXTENSION_PAGINATOR,
  GetExtensionReq,
  SubscriptionQuery
} from '@b3networks/api/bizphone';
import { ComplianceService } from '@b3networks/api/dnc';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { PaginationResponse, PaginatorPlugin } from '@datorama/akita';
import { Observable } from 'rxjs';
import { debounceTime, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { StoreExtensionComplianceComponent } from './store-extension-compliance/store-extension-compliance.component';

@Component({
  selector: 'b3n-extension-compliance',
  templateUrl: './extension-compliance.component.html',
  styleUrls: ['./extension-compliance.component.scss']
})
export class ExtensionComplianceComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  readonly displayedColumns = ['extension', 'dnc', 'consent', 'actions'];

  hasCompliance: boolean;
  searchQuery = new UntypedFormControl();
  pagination$: Observable<PaginationResponse<Extension>>;

  provisionedDNCLicense: number;
  totalDNCLicense: number;

  constructor(
    private complianceService: ComplianceService,
    private bizSubQuery: SubscriptionQuery,
    private extensionService: ExtensionService,
    @Inject(EXTENSION_PAGINATOR) public paginatorRef: PaginatorPlugin<Extension>,
    private dialog: MatDialog,
    private toastr: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.checkCompliance();

    this.bizSubQuery.subscription$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(i => i != null)
      )
      .subscribe(sub => (this.totalDNCLicense = sub.license.dncLicense));

    this.pagination$ = <Observable<PaginationResponse<Extension>>>this.paginatorRef.pageChanges.pipe(
      switchMap(page => {
        const reqFn = () =>
          this.extensionService.getPage(
            <GetExtensionReq>{
              isBypass: false,
              keyword: this.searchQuery.value
            },
            {
              page,
              perPage: 10
            }
          );

        return this.paginatorRef.getPage(reqFn) as Observable<PaginationResponse<Extension>>;
      }),
      tap(p => {
        this.provisionedDNCLicense = p.total;
      })
    );

    this.searchQuery.valueChanges.pipe(debounceTime(300)).subscribe(q => {
      this.paginatorRef.clearCache();
      this.paginatorRef.setPage(0);
    });
  }

  refresh() {
    this.paginatorRef.clearCache();
    this.paginatorRef.refreshCurrentPage();
  }

  addOrEditCompliance(extension?: Extension) {
    this.dialog
      .open(StoreExtensionComplianceComponent, {
        width: '500px',
        data: extension
      })
      .afterClosed()
      .subscribe(updated => {
        if (updated) {
          this.refresh();
        }
      });
  }

  remove(extension: Extension) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '560px',
        data: <ConfirmDialogInput>{
          title: 'Remove compliance',
          message: `Are you sure to remove the compliance config for extension ${extension.displayText}?`,
          confirmLabel: 'Remove',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.extensionService.updateDnc(extension.extKey, ComplianceAction.BYPASS, ComplianceAction.BYPASS).subscribe(
            _ => {
              this.toastr.success(`Remove compliance successfully`);
              this.refresh();
            },
            error => {
              this.toastr.warning(error.message);
            }
          );
        }
      });
  }

  changePage(page?: number) {
    this.paginatorRef.setPage(page);
  }

  override ngOnDestroy(): void {
    this.paginatorRef.destroy();
  }

  private checkCompliance() {
    this.complianceService.get().subscribe(result => (this.hasCompliance = result != null));
  }
}
