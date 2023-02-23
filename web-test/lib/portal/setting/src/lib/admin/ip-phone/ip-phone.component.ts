import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Device, DeviceQuery, DeviceService } from '@b3networks/api/bizphone';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, tap } from 'rxjs/operators';
import { EditDeviceComponent } from './edit-device/edit-device.component';
import { FirewallConfigComponent } from './firewall-config/firewall-config.component';

@Component({
  selector: 'b3n-ip-phone',
  templateUrl: './ip-phone.component.html',
  styleUrls: ['./ip-phone.component.scss']
})
export class IpPhoneComponent implements OnInit {
  readonly displayedColumns = ['device', 'name', 'extension', 'securityPassword', 'actions'];

  filterForm: UntypedFormGroup;
  dataSource = new MatTableDataSource<Device>();
  devices$: Observable<Device[]>;

  loading$: Observable<boolean>;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private deviceQuery: DeviceQuery,
    private deviceService: DeviceService,
    private fb: UntypedFormBuilder,
    private dialog: MatDialog,
    private toastr: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initUI();
  }

  ngOnInit(): void {
    this.loading$ = combineLatest([
      this.deviceQuery.selectLoading(),
      this.deviceQuery.selectAutoProvision(),
      this.deviceQuery.selectDeleting()
    ]).pipe(
      distinctUntilChanged(),
      map(([loading, provisioning, deleting]) => loading || provisioning || deleting)
    );

    this.devices$ = this.deviceQuery.devices$.pipe(
      tap(devices => {
        this.dataSource.data = devices;
        this.dataSource.paginator = this.paginator;
      })
    );
    this.refresh();
  }

  refresh() {
    this.deviceService.get().subscribe();
  }

  autoProvision() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '560px',
        data: <ConfirmDialogInput>{
          title: 'Auto provision devices',
          message: 'All incomplete IP Phone devices will be assigned to a extension randomly. Do you want to continue?'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.deviceService.autoProvision().subscribe(
            res => {
              console.log(res);
              this.toastr.success('Provision devices successfully');
              this.refresh();
            },
            err => {
              const msg = err.message || err.errMsg;
              this.toastr.warning(msg);
            }
          );
        }
      });
  }

  firewallConfig() {
    this.dialog.open(FirewallConfigComponent, {
      width: '560px'
    });
  }

  editDevice(device: Device) {
    this.dialog.open(EditDeviceComponent, {
      width: '500px',
      data: device
    });
  }

  unassignExt(device: Device) {
    const ext = device.extLabel + ' (#' + device.ext + ')';

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '560px',
        data: <ConfirmDialogInput>{
          title: 'Unassign extension',
          message: `This operation will unassign ${ext} from the IP phone device (Mac address: ${device.deviceUuid})`,
          confirmLabel: 'Unassign',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.deviceService.unassignExt(device).subscribe(
            _ => {
              this.toastr.success('Unassign extension successfully');
            },
            error => {
              this.toastr.warning(error.message);
            }
          );
        }
      });
  }

  private initUI() {
    this.filterForm = this.fb.group({
      searchQuery: this.fb.control(''),
      unassignedOnly: this.fb.control(false)
    });

    this.filterForm.valueChanges.pipe(debounceTime(200)).subscribe(value => {
      console.log(value);
      this.devices$ = this.deviceQuery.selectDevices(value).pipe(
        tap(devices => {
          this.dataSource.data = devices;
          this.dataSource.paginator = this.paginator;
        })
      );
    });
  }

  back() {
    this.router.navigate(['.'], { relativeTo: this.route.parent });
  }

  copied() {
    this.toastr.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastr.error('Copy failed');
  }
}
