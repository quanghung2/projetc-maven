import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { DeviceType, ExtDevice, Extension, ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService } from '@b3networks/api/callcenter';
import { DEFAULT_WARNING_MESSAGE } from '@b3networks/portal/setting';
import { B3_ORG_UUID, DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { cloneDeep } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { filter, finalize, map, takeUntil, tap } from 'rxjs/operators';
import { AppStateQuery } from '../../shared/state/app-state.query';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'b3n-settings-devices',
  templateUrl: './settings-devices.component.html',
  styleUrls: ['./settings-devices.component.scss']
})
export class SettingsDevicesComponent extends DestroySubscriberComponent implements OnInit {
  extension$: Observable<Extension | ExtensionBase>;
  extension: Extension;
  activatedDevices: ExtDevice[];
  editingDevices: HashMap<ExtDevice>;
  saving: boolean;

  constructor(
    private extensionQuery: ExtensionQuery,
    private appStateQuery: AppStateQuery,
    private extensionService: ExtensionService,
    private toastService: ToastService,
    public settingsService: SettingsService
  ) {
    super();
  }

  ngOnInit(): void {
    this.extension$ = combineLatest([this.extensionQuery.selectActive(), this.appStateQuery.hasBrowserLicense$]).pipe(
      takeUntil(this.destroySubscriber$),
      filter(([ext, _]) => !!ext),
      tap(([ext, hasBrowser]) => {
        this.extension = new Extension(cloneDeep(ext));
        this.editingDevices = {};

        const activatedDevices = this.extension.activeDevices;
        const ringDevices = this.extension.ringConfig.activatedDevices || [];
        const devices = ringDevices.map(dt => activatedDevices.find(dv => dv.deviceType === dt)).filter(d => !!d);

        devices.push(...activatedDevices.filter(dv => !ringDevices.includes(dv.deviceType)));

        // TODO hardcoding for b3 can use webrtc device
        this.activatedDevices =
          hasBrowser || X.orgUuid === B3_ORG_UUID ? devices : devices.filter(d => d?.deviceType !== DeviceType.WEBRTC);
      }),
      map(([ext, _]) => ext)
    );
  }

  dropDispositionCodes(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.activatedDevices, event.previousIndex, event.currentIndex);

    this.extension.ringConfig.activatedDevices = this.activatedDevices
      .filter(x => this.extension.ringConfig.activatedDevices.indexOf(x.deviceType) > -1)
      .map(x => x.deviceType);

    this.save('Change position successfully');
  }

  shiftChanged(option: DeviceType) {
    setTimeout(() => {
      const index = this.extension.ringConfig.activatedDevices.findIndex(x => x === option);
      let msg = '';

      if (index > -1 && this.extension.ringConfig.activatedDevices.length > 1) {
        this.extension.ringConfig.activatedDevices.splice(index, 1);
        msg = 'Disable successfully';
      } else if (index === -1) {
        this.extension.ringConfig.activatedDevices.push(option);
        msg = 'Enable successfully';
      } else {
        msg = '';
      }

      this.save(msg);
    }, 300);
  }

  save(msg) {
    this.saving = true;
    const ext: Partial<Extension> = {};

    ext.ringConfig = cloneDeep(this.extension.ringConfig);
    ext.ringConfig.version = 'v2';

    this.extensionService
      .update(this.extension.extKey, ext)
      .pipe(
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe(
        _ => {
          if (!msg) {
            this.toastService.warning('Must have at least 1 device');
          } else {
            this.toastService.success(msg);
          }
        },
        error => {
          this.toastService.warning(error.message || DEFAULT_WARNING_MESSAGE);
        }
      );
  }
}
