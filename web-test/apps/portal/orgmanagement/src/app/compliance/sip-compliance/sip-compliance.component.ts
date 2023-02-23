import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  ComplianceAction,
  Extension,
  EXTENSION_PAGINATOR,
  SipGateway,
  SipGatewayQuery,
  SipGatewayService
} from '@b3networks/api/bizphone';
import { ComplianceService } from '@b3networks/api/dnc';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { PaginatorPlugin } from '@datorama/akita';
import { Observable } from 'rxjs';
import { debounceTime, finalize, map, takeUntil } from 'rxjs/operators';
import { StoreSipComplianceComponent } from './store-sip-compliance/store-sip-compliance.component';

@Component({
  selector: 'b3n-sip-compliance',
  templateUrl: './sip-compliance.component.html',
  styleUrls: ['./sip-compliance.component.scss']
})
export class SipComplianceComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  readonly displayedColumns = ['name', 'dnc', 'consent', 'actions'];

  isLoading: boolean;
  hasCompliance: boolean;
  searchQuery = new UntypedFormControl();
  dataSource = new MatTableDataSource<SipGateway>();

  cannotCreateCompliance$: Observable<boolean>;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private complianceService: ComplianceService,
    private sipGWQuery: SipGatewayQuery,
    private sipGWService: SipGatewayService,
    @Inject(EXTENSION_PAGINATOR) public paginatorRef: PaginatorPlugin<Extension>,
    private dialog: MatDialog,
    private toastr: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.checkCompliance();

    this.sipGWQuery.sipGWsHasCompliance$.pipe(takeUntil(this.destroySubscriber$)).subscribe(result => {
      this.dataSource.data = result;
      this.dataSource.paginator = this.paginator;
    });

    this.cannotCreateCompliance$ = this.sipGWQuery.sipGWsHasNotCompliance$.pipe(map(l => l.length === 0));

    this.searchQuery.valueChanges.pipe(debounceTime(300)).subscribe(q => {});

    this.refresh();
  }

  refresh() {
    this.isLoading = true;
    this.sipGWService
      .get()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe();
  }

  addOrEditCompliance(sipgw?: SipGateway) {
    this.dialog
      .open(StoreSipComplianceComponent, {
        width: '500px',
        data: sipgw
      })
      .afterClosed()
      .subscribe(updated => {
        if (updated) {
          this.refresh();
        }
      });
  }

  remove(sipgw: SipGateway) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '560px',
        data: <ConfirmDialogInput>{
          title: 'Remove compliance',
          message: `Are you sure to remove the compliance config for SIP ${sipgw.sipUsername}?`,
          confirmLabel: 'Remove',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.sipGWService
            .updateCompliance(sipgw.sipUsername, { dnc: ComplianceAction.BYPASS, consent: ComplianceAction.BYPASS })
            .subscribe(
              _ => {
                this.toastr.success('Remove compliance succefully');
              },
              error => {
                this.toastr.warning(error.message);
              }
            );
        }
      });
  }

  private checkCompliance() {
    this.complianceService.get().subscribe(result => (this.hasCompliance = result != null));
  }
}
