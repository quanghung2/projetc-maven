import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { HeaderRelayProfile, HeaderRelayService, PreConfig, PreConfigQuery } from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';
import { HeaderRelayModalComponent, HeaderRelayModalInput } from '../header-relay-modal/header-relay-modal.component';

@Component({
  selector: 'b3n-header-relay',
  templateUrl: './header-relay.component.html',
  styleUrls: ['./header-relay.component.scss']
})
export class HeaderRelayComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() cluster: string;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  displayedColumns: string[] = ['name', 'headerRelay', 'action'];
  headerRelayProfile = new MatTableDataSource<HeaderRelayProfile>();
  isLoading: boolean;
  preConfig: PreConfig;

  constructor(
    private headerRelayService: HeaderRelayService,
    private dialog: MatDialog,
    private preConfigQuery: PreConfigQuery,
    private toastService: ToastService
  ) {
    super();
  }
  ngOnInit(): void {}

  ngOnChanges(): void {
    this.getHeaderRelay();
    this.preConfigQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(res => {
        this.preConfig = res;
      });
  }

  showCreateHeaderRelay() {
    this.dialog
      .open(HeaderRelayModalComponent, {
        width: '100%',
        data: <HeaderRelayModalInput>{
          isEdit: false,
          preConfig: this.preConfig,
          headerRelays: [...this.headerRelayProfile?.filteredData],
          cluster: this.cluster
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.toastService.success('Add header relay successfully');
          this.getHeaderRelay();
          return;
        }
        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  editHeaderRelay(headerRelay: HeaderRelayProfile) {
    this.dialog
      .open(HeaderRelayModalComponent, {
        width: '100%',
        data: <HeaderRelayModalInput>{
          isEdit: true,
          preConfig: this.preConfig,
          headerRelay: headerRelay,
          headerRelays: [...this.headerRelayProfile?.filteredData],
          cluster: this.cluster
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.toastService.success('Edit header relay successfully');
          this.getHeaderRelay();
          return;
        }
        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  confirmDeleteHeaderRelay(headerRelay: HeaderRelayProfile) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete  Header relay',
          message: `This action will delete <b>${headerRelay.name}</b> from Header relay. Are you sure to delete?`,
          color: 'warn',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deleteHeaderRelay(headerRelay);
        }
      });
  }

  private deleteHeaderRelay(headerRelay: HeaderRelayProfile) {
    this.headerRelayService.deleteHeaderRelayProfile(headerRelay.name, this.cluster).subscribe(
      res => {
        this.getHeaderRelay();
        this.toastService.success('Delete header relay successfully');
      },
      error => this.toastService.error(error)
    );
  }

  private getHeaderRelay() {
    this.isLoading = true;
    this.headerRelayService
      .getHeaderRelayProfile(this.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        relays => {
          const data = relays?.sort((a, b) => {
            return ('' + a.name).localeCompare(b.name);
          });
          this.headerRelayProfile = new MatTableDataSource<HeaderRelayProfile>(data);
          this.headerRelayProfile.paginator = this.paginator;
        },
        error => this.toastService.error(error)
      );
  }
}
