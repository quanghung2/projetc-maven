import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ManipulationProfile, ManipulationService, PreConfig, PreConfigQuery } from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { finalize, takeUntil } from 'rxjs/operators';
import { ManipulationModalComponent } from '../manipulation-modal/manipulation-modal.component';

@Component({
  selector: 'b3n-manipulation',
  templateUrl: './manipulation.component.html',
  styleUrls: ['./manipulation.component.scss']
})
export class ManipulationComponent extends DestroySubscriberComponent implements OnChanges {
  @Input() cluster: string;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  displayedColumns = ['name', 'action'];
  isLoading: boolean;
  manipulationProfile = new MatTableDataSource<ManipulationProfile>();
  manipulationOrigin: ManipulationProfile[] = [];
  preConfig: PreConfig;

  constructor(
    private manipulationService: ManipulationService,
    private dialog: MatDialog,
    private preConfigQuery: PreConfigQuery,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnChanges(): void {
    this.getManipulation();
    this.preConfigQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(res => {
        this.preConfig = res;
      });
  }

  getManipulation() {
    this.isLoading = true;
    this.manipulationService
      .getManipulation(this.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          const data = res?.sort((a, b) => {
            return ('' + a.name).localeCompare(b.name);
          });
          this.manipulationProfile = new MatTableDataSource<ManipulationProfile>(data);
          this.manipulationProfile.paginator = this.paginator;
        },
        error => this.toastService.error(error)
      );
  }

  showCreateManipulation() {
    this.dialog
      .open(ManipulationModalComponent, {
        width: '610px',
        data: {
          isEdit: false,
          preConfig: this.preConfig,
          manipulation: this.manipulationOrigin,
          cluster: this.cluster
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.toastService.success('Add manipulation successfully');
          this.getManipulation();
          return;
        }
        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  editManipulation(manipulationProfile: ManipulationProfile) {
    this.dialog
      .open(ManipulationModalComponent, {
        width: '610px',
        data: {
          isEdit: true,
          preConfig: this.preConfig,
          manipulation: cloneDeep(manipulationProfile),
          cluster: this.cluster
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res?.success) {
          this.toastService.success('Edit manipulation successfully');
          this.getManipulation();
          return;
        }
        if (res?.error) {
          this.toastService.error(res.error);
        }
      });
  }

  confirmDeleteManipulation(manipulation: ManipulationProfile) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete Manipulation',
          message: 'Are you sure you want to delete this manipulation?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deleteManipulation(manipulation);
        }
      });
  }

  deleteManipulation(manipulation: ManipulationProfile) {
    this.manipulationService.deleteManipulation(manipulation.name, this.cluster).subscribe(
      res => {
        this.getManipulation();
        this.toastService.success('Delete manipulation successfully');
      },
      err => {
        this.toastService.error(err);
      }
    );
  }
}
