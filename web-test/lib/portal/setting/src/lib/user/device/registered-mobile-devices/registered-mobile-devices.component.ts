import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  Device,
  DeviceService,
  ExtensionQuery,
  ExtensionService,
  UpdateRegisteredDeviceReq
} from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-registered-mobile-devices',
  templateUrl: './registered-mobile-devices.component.html',
  styleUrls: ['./registered-mobile-devices.component.scss']
})
export class RegisteredMobileDevicesComponent implements OnInit, AfterViewInit {
  readonly displayedColumns = ['name', 'createdTime', 'actions'];
  @ViewChild(MatPaginator) paginator: MatPaginator;

  loading: boolean;
  isEditing: boolean;
  dataSource: MatTableDataSource<Device>;
  selectedDevice: Device;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Device[],
    private extensionService: ExtensionService,
    private extensionQuery: ExtensionQuery,
    private toastService: ToastService,
    private deviceService: DeviceService
  ) {}

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource(this.data);
  }

  switchToEditMode(device: Device): void {
    this.isEditing = true;
    this.selectedDevice = device;
  }

  refetch() {
    this.loading = true;
    const extKey = this.extensionQuery.getActive().extKey;
    this.deviceService
      .getRegisteredMobileDevices(extKey)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(devices => {
        this.dataSource = new MatTableDataSource(devices);
      });
  }

  updateDevice() {
    this.loading = true;
    const req = {
      deviceName: this.selectedDevice.deviceInfo.deviceName,
      deviceId: this.selectedDevice.deviceId
    } as UpdateRegisteredDeviceReq;

    this.deviceService
      .updateDevice(req)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(_ => {
        this.isEditing = false;
        this.toastService.success('Updated successfully');
      });
  }

  back() {
    this.isEditing = false;
  }
}
