import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeviceType, ExtDevice, Extension, ExtensionBase, RingMode } from '@b3networks/api/bizphone';
import { Device, DeviceService, ExtensionQuery, ExtensionService, UpdateExtDevice } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { cloneDeep, includes } from 'lodash';
import { Observable, of } from 'rxjs';
import { catchError, finalize, takeUntil, tap } from 'rxjs/operators';
import { DEFAULT_WARNING_MESSAGE } from '../../shared/contants';
import { RegisteredMobileDevicesComponent } from './registered-mobile-devices/registered-mobile-devices.component';

@Component({
  selector: 'b3n-device',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss']
})
export class DeviceComponent extends DestroySubscriberComponent implements OnInit {
  readonly DeviceType = DeviceType;
  extension$: Observable<Extension | ExtensionBase>;

  extension: Extension;

  activatedDevices: ExtDevice[];

  editingDevices: HashMap<ExtDevice>; // map by deviceType

  progressing: boolean;
  mobileDevices: Device[] = [];
  deviceCountMapping: HashMap<number> = {};
  primaryDevice: Device;
  listDeviceWithSipDefault: Device[];
  listDevicesSelector: Device[];

  readonly RingMode = RingMode;
  readonly optRingTime: KeyValue<number, string>[] = [
    { key: 15, value: '15' },
    { key: 20, value: '20' },
    { key: 30, value: '30' },
    { key: 45, value: '45' },
    { key: 60, value: '60' },
    { key: 90, value: '90' }
  ];

  constructor(
    private toastService: ToastService,
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private dialog: MatDialog,
    private deviceService: DeviceService
  ) {
    super();
  }

  ngOnInit() {
    this.extension$ = this.extensionQuery.selectActive().pipe(
      tap(ext => {
        if (ext instanceof Extension) {
          this.extension = new Extension(cloneDeep(ext));

          this.editingDevices = {};

          const activatedDevices = this.extension.activeDevices
            .reduce((acc, device) => {
              const existingDeviceType = acc.find(d => d.identifier === device.identifier);

              if (!existingDeviceType) {
                this.deviceCountMapping[device.identifier] = this.extension.activeDevices?.filter(
                  d => d.identifier === device.identifier
                )?.length;
                acc.push(device);
              }

              return acc;
            }, [])
            .filter(d => !d.isDelegated); // ignore delegated devices
          const ringDevices = this.extension.ringConfig.activatedDevices || [];

          const devices = ringDevices.map(dt => activatedDevices.find(dv => dv.deviceType === dt)).filter(d => !!d); // ring devices contain inactive devices
          devices.push(...activatedDevices.filter(dv => !ringDevices.includes(dv.deviceType)));

          this.activatedDevices = devices;

          this.deviceService
            .getDevices(this.extension.extKey)
            .pipe(takeUntil(this.destroySubscriber$))
            .subscribe(devices => {
              const dataDevices = [...devices];
              const indexDevicePrimary = dataDevices.findIndex(device => !!device.isPrimary);
              if (indexDevicePrimary > -1) this.primaryDevice = dataDevices[indexDevicePrimary];
              else {
                dataDevices[0].isPrimary = true;
                this.primaryDevice = dataDevices[0];
              }
              this.listDeviceWithSipDefault = dataDevices.filter(device => device.sipAccount);
              this.listDevicesSelector = [...this.listDeviceWithSipDefault].filter(device =>
                ringDevices.includes(device.deviceType)
              );
            });

          this.getRegisteredMobileDevices();
        }
      })
    );
  }

  shiftChanged(option: DeviceType) {
    const index = this.extension.ringConfig.activatedDevices.findIndex(x => x === option);

    if (index > -1 && this.extension.ringConfig.activatedDevices.length > 1) {
      this.extension.ringConfig.activatedDevices.splice(index, 1);
    } else if (index === -1) {
      this.extension.ringConfig.activatedDevices.push(option);
    }

    this.listDevicesSelector = [...this.listDeviceWithSipDefault].filter(device =>
      this.extension.ringConfig.activatedDevices.includes(device.deviceType)
    );

    const primaryDeviceIndex = this.listDevicesSelector.findIndex(device => !!device.isPrimary);
    if (primaryDeviceIndex > -1) this.primaryDevice = this.listDevicesSelector[primaryDeviceIndex];
    else if (!includes(this.listDevicesSelector, this.primaryDevice)) this.primaryDevice = this.listDevicesSelector[0];
  }

  dropDispositionCodes(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.activatedDevices, event.previousIndex, event.currentIndex);
  }

  toggleTLS(ext: Extension, device: ExtDevice) {
    device.sipAccount.isEnabledTLS ? device.sipAccount.disableTLS() : device.sipAccount.enableTLS();
    this.editingDevices[device.deviceType] = device;
  }

  toggleSTUN(ext: Extension, device: ExtDevice) {
    device.sipAccount.isEnabledSTUN ? device.sipAccount.disableSTUN() : device.sipAccount.enableSTUN();
    this.editingDevices[device.deviceType] = device;
  }

  async onSave() {
    this.progressing = true;

    const ringConfig = this.extension.ringConfig;
    ringConfig.version = 'v2'; // set to v2 to make sure update api with v2
    ringConfig.activatedDevices = this.activatedDevices
      .filter(x => ringConfig.activatedDevices.indexOf(x.deviceType) > -1)
      .map(x => x.deviceType);

    const updateExtDeviceReqs$: Observable<void>[] = Object.keys(this.editingDevices).map(type => {
      const d = this.editingDevices[type];
      const req = <UpdateExtDevice>{
        protocol: d.sipAccount.protocol,
        serverPort: d.sipAccount.serverPort,
        codec: d.sipAccount.codec,
        stunServer: d.sipAccount.stunServer
      };

      return this.extensionService
        .updateExtDevice(
          { extKey: this.extension.extKey, deviceType: d.deviceType, sipUsername: d.sipAccount.username },
          req
        )
        .pipe(catchError(_ => of(null)));
    });

    // REAL UPDATE ext device is here
    for (const req$ of updateExtDeviceReqs$) {
      await req$.toPromise();
    }

    const primaryDevice = this.primaryDevice
      ? this.primaryDevice
      : this.listDeviceWithSipDefault.find(device => !!device.isPrimary);

    if (primaryDevice) {
      const { serverPort, protocol, codec, stunServer, enableIpv6, username } = primaryDevice.sipAccount;
      const { deviceType } = primaryDevice;
      const req = <UpdateExtDevice>{
        serverPort,
        protocol,
        codec,
        stunServer,
        enableIpv6,
        isPrimary: !!this.primaryDevice
      };
      const id = {
        extKey: this.extension.extKey,
        deviceType,
        sipUsername: username
      };

      this.extensionService.updateExtDevice(id, req).subscribe();
    }

    this.extensionService
      .update(this.extension.extKey, {
        ringConfig: ringConfig,
        devices: this.extension.devices, // PUT here to update entity store
        mailBox: this.extension.mailBox
      })
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.toastService.success('Applied successfully!');
        },
        error => {
          console.log(error);

          this.progressing = false;
          this.toastService.warning(error.message || DEFAULT_WARNING_MESSAGE);
        }
      );
  }

  getRegisteredMobileDevices() {
    this.deviceService
      .getRegisteredMobileDevices(this.extension.extKey)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(devices => {
        this.mobileDevices = devices;
      });
  }

  openManageDialog(): void {
    this.dialog.open(RegisteredMobileDevicesComponent, {
      autoFocus: false,
      minWidth: '450px',
      disableClose: true,
      data: this.mobileDevices || []
    });
  }
}
