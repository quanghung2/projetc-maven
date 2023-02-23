import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInput } from '@angular/material/input';
import { Dashboard, DashboardService, DashboardType } from '@b3networks/api/dashboard';
import { ToastService } from '@b3networks/shared/ui/toast';
import { of } from 'rxjs';
import { finalize, mergeMap } from 'rxjs/operators';

export enum StoreType {
  create,
  update
}

@Component({
  selector: 'b3n-store-dashboard',
  templateUrl: './store-dashboard.component.html',
  styleUrls: ['./store-dashboard.component.scss']
})
export class StoreDashboardComponent implements OnInit {
  StoreType = StoreType;
  @ViewChild('dashboardName') dashboardNameInput: MatInput;

  type: StoreType;
  dashboard: Dashboard;
  progressing: boolean;
  radioOptions: KeyValue<DashboardType, string>[] = [
    { key: DashboardType.wallboard, value: 'Wallboard' },
    { key: DashboardType.virtual_line, value: 'Virtual Line' }
  ];
  selectedType = this.radioOptions[0].key;

  constructor(
    private dialogRef: MatDialogRef<StoreDashboardComponent>,
    @Inject(MAT_DIALOG_DATA) dashboard: Dashboard,
    private dashboardService: DashboardService,
    private toastService: ToastService
  ) {
    this.type = !!dashboard && !!dashboard.uuid ? StoreType.update : StoreType.create;
    this.dashboard = this.type === StoreType.update ? dashboard.clone() : new Dashboard();
    setTimeout(() => {
      this.dashboardNameInput.focus();
    }, 250);
  }

  get isCreateType() {
    return this.type === StoreType.create;
  }

  ngOnInit() {}

  progress() {
    this.progressing = true;
    if (this.selectedType === DashboardType.virtual_line) {
      this.dashboard.service = DashboardType.virtual_line;
    } else {
      this.dashboard.service = DashboardType.wallboard;
    }

    of(this.isCreateType)
      .pipe(
        mergeMap(isCreateType =>
          isCreateType ? this.dashboardService.create(this.dashboard) : this.dashboardService.update(this.dashboard)
        ),
        finalize(() => (this.progressing = false))
      )
      .subscribe(
        dashboard => {
          this.dialogRef.close(dashboard);
          this.toastService.success(
            `Dashboard ${this.dashboard.name} has been ${this.isCreateType ? 'created' : 'updated'}`
          );
        },
        error => {
          this.toastService.error(error);
        }
      );
  }

  radioButtonChanged(type: DashboardType) {
    this.selectedType = type;
  }
}
