import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PreConfig, PreConfigQuery, SecurityProfile, SecurityService } from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';
import { CapacityModalComponent, CapacityModalInput } from '../capacity-modal/capacity-modal.component';

@Component({
  selector: 'b3n-capacity',
  templateUrl: './capacity.component.html',
  styleUrls: ['./capacity.component.scss']
})
export class CapacityComponent extends DestroySubscriberComponent implements OnChanges {
  @Input() cluster: string;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  displayedColumns = ['name', 'cps', 'capacity', 'action'];
  isLoading: boolean;
  securitysProfile = new MatTableDataSource<SecurityProfile>();
  preConfig: PreConfig;

  constructor(
    private securityService: SecurityService,
    private dialog: MatDialog,
    private preConfigQuery: PreConfigQuery,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnChanges(): void {
    this.getCapacity();
    this.preConfigQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(res => {
        this.preConfig = res;
      });
  }

  getCapacity() {
    this.isLoading = true;
    this.securityService
      .getSecurityProfile(this.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          const data = res?.sort((a, b) => {
            return ('' + a.name).localeCompare(b.name);
          });
          this.securitysProfile = new MatTableDataSource<SecurityProfile>(data);
          this.securitysProfile.paginator = this.paginator;
        },
        err => this.toastService.error(err)
      );
  }

  onShowCreateCapacity() {
    this.dialog
      .open(CapacityModalComponent, {
        width: '520px',
        data: {
          isEdit: false,
          preConfig: this.preConfig,
          securitys: [...this.securitysProfile?.filteredData],
          cluster: this.cluster
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.toastService.success('Add capacity successfully');
          this.getCapacity();
          return;
        }
        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  editCapacity(security: SecurityProfile) {
    this.dialog
      .open(CapacityModalComponent, {
        width: '520px',
        data: <CapacityModalInput>{
          isEdit: true,
          security: security,
          preConfig: this.preConfig,
          securitys: [...this.securitysProfile?.filteredData],
          cluster: this.cluster
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.toastService.success('Edit capacity successfully');
          this.getCapacity();
          return;
        }
        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  confirmDeleteCapacity(codec: SecurityProfile) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete Capacity',
          message: 'Are you sure you want to delete this capacity?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deleteCapacity(codec);
        }
      });
  }

  deleteCapacity(security: SecurityProfile) {
    this.securityService.deleteSecurityProfile(security.name, this.cluster).subscribe(
      res => {
        this.getCapacity();
        this.toastService.success('Delete capacity successfully');
      },
      err => this.toastService.error(err)
    );
  }
}
