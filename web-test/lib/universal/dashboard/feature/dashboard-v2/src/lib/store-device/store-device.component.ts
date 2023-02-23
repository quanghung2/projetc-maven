import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService } from '@b3networks/api/callcenter';
import { DashboardV2Service, PublicDevice } from '@b3networks/api/dashboard';
import { DEFAULT_WARNING_MESSAGE } from '@b3networks/portal/setting';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { combineLatest, debounceTime, finalize, firstValueFrom, forkJoin, startWith, takeUntil, tap } from 'rxjs';
import { first } from 'rxjs/operators';
import { EditDeviceComponent } from './edit-device/edit-device.component';

export interface StoreDeviceInput {
  title: string;
  isOwner: boolean;
  manageMember?: boolean;
}

export type StoreDeviceForm = FormGroup<{
  search: FormControl<string>;
  user: FormControl<string>;
}>;

@Component({
  selector: 'b3n-store-device',
  templateUrl: './store-device.component.html',
  styleUrls: ['./store-device.component.scss']
})
export class StoreDeviceComponent extends DestroySubscriberComponent implements OnInit {
  displayedColumns: string[] = ['extLabel', 'deviceName', 'dashboardNames', 'isActive', 'actions'];
  publicDevices: PublicDevice[] = [];
  publicDevicesFilter: PublicDevice[] = [];
  dataSource: MatTableDataSource<PublicDevice>;
  form: StoreDeviceForm;
  users: ExtensionBase[] = [];
  loading: boolean;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public dialogRef: MatDialogRef<StoreDeviceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreDeviceInput,
    private dashboardV2Service: DashboardV2Service,
    private extensionService: ExtensionService,
    private extensionQuery: ExtensionQuery,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    if (!this.data.isOwner || (this.data.isOwner && !this.data.manageMember)) {
      this.displayedColumns.shift();
    }

    this.initForm();
    this.initData();
  }

  initForm() {
    this.form = this.fb.group({
      search: [''],
      user: ['']
    });

    combineLatest([this.search.valueChanges.pipe(startWith('')), this.user.valueChanges.pipe(startWith(''))])
      .pipe(
        takeUntil(this.destroySubscriber$),
        debounceTime(200),
        tap(([search, user]) => {
          const keyword = search.trim().toLowerCase();

          this.publicDevicesFilter = this.publicDevices.filter(device => {
            const searchCondition = () => device.deviceName?.toLowerCase().trim().includes(keyword);
            let userFilterCondition: () => void;

            switch (user) {
              case '':
                userFilterCondition = null;
                break;

              default:
                userFilterCondition = () => device.identityUuid === user;
                break;
            }

            return userFilterCondition ? searchCondition() && userFilterCondition() : searchCondition();
          });

          this.dataSource = new MatTableDataSource(this.publicDevicesFilter);
          this.dataSource.paginator = this.paginator;

          setTimeout(() => {
            this.handleCurrentPageData();
          }, 0);
        })
      )
      .subscribe();
  }

  initData() {
    this.loading = true;
    this.users = [];
    this.form.patchValue({
      search: '',
      user: ''
    });

    forkJoin([
      this.dashboardV2Service.getPublicDevices(this.data.isOwner && this.data.manageMember),
      this.dashboardV2Service.getDashboards()
    ])
      .pipe(
        finalize(() => (this.loading = false)),
        tap(async ([publicDevices, dashboards]) => {
          const extensions: ExtensionBase[] = await firstValueFrom(
            this.extensionQuery.getHasCache()
              ? this.extensionQuery.allAssignedExtensions$.pipe(first())
              : this.extensionService.getAllExtenison(false)
          );

          this.publicDevices = publicDevices.map(device => {
            const ext = extensions.find(e => e.identityUuid === device.identityUuid);
            const dashboardNames = device.dashboardUuids
              .map(uuid => {
                const dashboard = dashboards.find(d => d.uuid === uuid);
                return dashboard?.name ?? '';
              })
              .filter(name => !!name)
              .join(', ');

            if (ext && !this.users.find(u => u.identityUuid === ext.identityUuid)) {
              this.users.push(ext);
            }

            return {
              ...device,
              extLabel: ext?.extLabel ?? '',
              dashboardNames,
              isActive: null
            };
          });

          this.publicDevicesFilter = cloneDeep(this.publicDevices);
          this.dataSource = new MatTableDataSource(this.publicDevicesFilter);

          setTimeout(() => {
            this.dataSource.paginator = this.paginator;

            setTimeout(() => {
              this.handleCurrentPageData();
            }, 0);
          }, 0);
        })
      )
      .subscribe();
  }

  editDevice(device: PublicDevice) {
    this.dialog
      .open(EditDeviceComponent, {
        width: '400px',
        height: '200px',
        panelClass: 'edit-device__dashboard2',
        data: {
          device
        }
      })
      .afterClosed()
      .pipe(
        tap(updated => {
          if (updated) {
            this.initData();
          }
        })
      )
      .subscribe();
  }

  removeDevice(device: PublicDevice) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: `Confirm remove device`,
          message: `
                      Remove <strong>${device.deviceName}</strong>? 
                      <br /> 
                      <span class="sub-title">The device will be logged out immediately</span>
                   `,
          confirmLabel: 'Remove',
          cancelLabel: 'Cancel',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(async res => {
        if (res) {
          try {
            await firstValueFrom(this.dashboardV2Service.removeDevice(device.deviceId));
            this.toastService.success(`Remove successfully`);
            this.initData();
          } catch (e) {
            this.toastService.error(e['message'] ?? DEFAULT_WARNING_MESSAGE);
          }
        }
      });
  }

  page(_: PageEvent) {
    this.handleCurrentPageData();
  }

  handleCurrentPageData() {
    if (!this.paginator) {
      return;
    }

    const skip = this.paginator.pageSize * this.paginator.pageIndex;
    this.dataSource.data
      .filter((_, i) => i >= skip)
      .filter((_, i) => i < this.paginator.pageSize)
      .map((publicDevice, _) => {
        this.dashboardV2Service.checkDeviceStatus(publicDevice.deviceId).subscribe(device => {
          publicDevice.isActive = device.isActive;
        });
      });
  }

  get search() {
    return this.form.controls['search'];
  }

  get user() {
    return this.form.controls['user'];
  }
}
