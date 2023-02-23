import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeviceType, ExtDevice, Extension, ExtensionBase, RingConfig } from '@b3networks/api/bizphone';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';
import { cloneDeep } from 'lodash';
import { Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { DeviceDialogInput, DevicesDialogComponent } from './devices-dialog/devices-dialog.component';
@Component({
  selector: 'b3n-admin-tools-devices',
  templateUrl: './admin-tools-devices.component.html',
  styleUrls: ['./admin-tools-devices.component.scss']
})
export class AdminToolsDevicesComponent extends DestroySubscriberComponent implements OnInit {
  @Input() editingDevices: HashMap<ExtDevice>;
  @Output() setActivatedDevices = new EventEmitter<ExtDevice[]>();
  @Output() setEditingDevices = new EventEmitter<HashMap<ExtDevice>>();
  @Output() setRingConfig = new EventEmitter<RingConfig>();

  activatedDevices: ExtDevice[];
  extension$: Observable<Extension | ExtensionBase>;
  extension: Extension;
  preExtKey = '';
  readonly DeviceType = DeviceType;

  constructor(private extensionQuery: ExtensionQuery, private dialog: MatDialog) {
    super();
  }

  ngOnInit(): void {
    this.extensionQuery
      .selectActive()
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(ext => {
          if (ext instanceof Extension && this.preExtKey !== ext.extKey) {
            this.preExtKey = ext.extKey;
            this.extension = new Extension(cloneDeep(ext));
            this.activatedDevices = this.extension.activeDevices;
            this.setActivatedDevices.emit(this.activatedDevices);
          }
        })
      )
      .subscribe();
  }

  setupDevice(device: ExtDevice) {
    this.dialog.open(DevicesDialogComponent, {
      width: '450px',
      data: <DeviceDialogInput>{
        device,
        extKey: this.extension.extKey
      },
      disableClose: true
    });
  }

  dropDispositionCodes(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.activatedDevices, event.previousIndex, event.currentIndex);
    this.setActivatedDevices.emit(this.activatedDevices);
  }

  shiftChanged(option: DeviceType) {
    this.extension.ringConfig.activatedDevices = [...this.extension.ringConfig.activatedDevices];
    const index = this.extension.ringConfig.activatedDevices.findIndex(x => x === option);

    if (index > -1 && this.extension.ringConfig.activatedDevices.length > 1) {
      this.extension.ringConfig.activatedDevices.splice(index, 1);
    } else if (index === -1) {
      this.extension.ringConfig.activatedDevices.push(option);
    }

    this.setRingConfig.emit(this.extension.ringConfig);
  }

  emitEditingDevices(device: ExtDevice) {
    const editingDevices: HashMap<ExtDevice> = { ...this.editingDevices };
    editingDevices[device.deviceType] = device;
    this.setEditingDevices.emit(editingDevices);
  }
}
