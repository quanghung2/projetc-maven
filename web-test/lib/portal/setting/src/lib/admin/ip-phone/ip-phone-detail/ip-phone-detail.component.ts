import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { Device, DeviceQuery, DeviceService } from '@b3networks/api/bizphone';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, finalize, takeUntil, tap } from 'rxjs/operators';
import { ImportDevicesComponent } from '../import-devices/import-devices.component';
import { AssignDeviceComponent } from './assign-device/assign-device.component';

@Component({
  selector: 'b3n-ip-phone-detail',
  templateUrl: './ip-phone-detail.component.html',
  styleUrls: ['./ip-phone-detail.component.scss']
})
export class IpPhoneDetailComponent extends DestroySubscriberComponent implements OnInit {
  loading: boolean;
  progressing: boolean;
  isAdmin: boolean;
  updating: boolean;

  assignedDevice: Device;
  devices: Device[] = [];
  selectedExtensionKey: number | string;
  ipPhonesForm: UntypedFormGroup;

  constructor(
    private devideQuery: DeviceQuery,
    private deviceService: DeviceService,
    private fb: UntypedFormBuilder,
    private dialog: MatDialog,
    private toastService: ToastService,
    private extensionQuery: ExtensionQuery,
    private profileQuery: IdentityProfileQuery,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super();
  }

  get deviceName() {
    return this.ipPhonesForm.get('name')?.value;
  }

  ngOnInit(): void {
    combineLatest([this.devideQuery.devices$, this.extensionQuery.selectActiveId()])
      .pipe(tap(() => (this.loading = true)))
      .pipe(takeUntil(this.destroySubscriber$))
      .pipe(distinctUntilChanged(() => (this.loading = false)))
      .subscribe(data => {
        [this.devices, this.selectedExtensionKey] = data;
        this.assignedDevice = this.devices.find(d => d.ext === this.selectedExtensionKey);

        this.isAdmin = this.profileQuery.currentOrg.isUpperAdmin;
        this.initForm();
      });

    this.deviceService.get().subscribe();
  }

  initForm() {
    this.ipPhonesForm = this.fb.group({
      device: [this.assignedDevice, Validators.required],
      name: [this.assignedDevice?.name]
    });
  }

  assignExtensionToDevice() {
    this.dialog.open(AssignDeviceComponent, {
      width: '450px',
      autoFocus: false,
      data: this.devices
    });
  }

  updateDevice() {
    this.updating = true;

    const device = {
      ...this.assignedDevice,
      deviceUuid: this.ipPhonesForm.value.device?.deviceUuid,
      name: this.ipPhonesForm.value.name
    } as Device;

    this.deviceService
      .updateDevice(device)
      .pipe(finalize(() => (this.updating = false)))
      .subscribe(
        _ => {
          this.toastService.success('Updated successfully');
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  importDevices() {
    this.dialog.open(ImportDevicesComponent, {
      width: '560px'
    });
  }

  onChangeDevice(event: MatSelectChange) {
    const device = this.devices.find(d => d.id === event.value.id);
    this.ipPhonesForm.patchValue({ name: device?.name || '' });
  }

  unassign() {
    this.progressing = true;
    const device = { ...this.assignedDevice, ext: null, extType: null, extLabel: null } as Device;
    this.deviceService
      .updateDevice(device)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.toastService.success('Unassigned successfully');
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  routingManageDevicesPage() {
    this.router.navigate(['manage-devices'], { relativeTo: this.route.parent });
  }
}
