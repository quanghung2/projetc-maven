import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  IAMGrantedPermission,
  IAM_DNC_ACTIONS,
  IAM_SERVICES,
  IAM_UI_ACTIONS,
  OrgLinkMember,
  OrgLinkService,
  OrgMemberService,
  PolicyDocument
} from '@b3networks/api/auth';
import { ExtDevice, Extension, RingConfig, TransferCallerIdConfig } from '@b3networks/api/bizphone';
import {
  ExtensionQuery,
  ExtensionService,
  ScheduleQuery,
  ScheduleService,
  UpdateExtDevice
} from '@b3networks/api/callcenter';
import { PersonalWhitelistService } from '@b3networks/api/dnc';
import { DestroySubscriberComponent, downloadData, EnumTransferCallerIdOption, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { catchError, distinctUntilKeyChanged, filter, finalize, map, takeUntil, tap } from 'rxjs/operators';
import { DEFAULT_WARNING_MESSAGE } from '../../shared/contants';
import { AdminToolsPublicHolidayComponent } from './admin-tools-public-holiday/admin-tools-public-holiday.component';
import { ConfigPermissionComponent, PermissionDialogInput } from './config-permission/config-permission.component';
import { ImportCsvComponent } from './import-csv/import-csv.component';

@Component({
  selector: 'b3n-admin-tools',
  templateUrl: './admin-tools.component.html',
  styleUrls: ['./admin-tools.component.scss']
})
export class AdminToolsComponent extends DestroySubscriberComponent implements OnInit, AfterViewInit {
  @ViewChild('publicHoliday') publicHoliday: AdminToolsPublicHolidayComponent;

  extension: Extension;
  transferCallerIdOption = EnumTransferCallerIdOption;
  form: UntypedFormGroup;
  activatedDevices: ExtDevice[];
  editingDevices: HashMap<ExtDevice> = {};
  enableDebugMode: boolean;
  ringConfig: RingConfig;
  loading: boolean;
  loadingExport: boolean;
  noMember: boolean;
  orgLinks: OrgLinkMember[];

  private policy: PolicyDocument;

  constructor(
    private fb: UntypedFormBuilder,
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private scheduleService: ScheduleService,
    private scheduleQuery: ScheduleQuery,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private orgMemberService: OrgMemberService,
    private orgLinkService: OrgLinkService,
    private personalWhitelistService: PersonalWhitelistService
  ) {
    super();
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.initForm();
    this.listenExtension();
  }

  initForm(): void {
    this.form = this.fb.group({
      internal: [''],
      external: [''],
      forwardInternal: [''],
      forwardExternal: [''],
      outbound: [''],
      inbound: [''],
      permissionCheckboxes: this.fb.group({
        allowCallRecording: [false],
        allowAccessCR: [false],
        allowDNC: [false],
        allowPrivateCallerId: [false]
      }),
      featureCheckboxes: this.fb.group({
        enableCallWaiting: [false],
        enableDebugMode: [false],
        usingPin: [false],
        enableWhitelist: [false],
        enableAndroidBackground: [false]
      }),
      passcode: ['', Validators.required]
    });

    (this.form.controls['featureCheckboxes'] as UntypedFormGroup).controls['usingPin'].valueChanges
      .pipe(
        tap(usingPin => {
          const { passcode } = this.form.controls;

          passcode.setErrors(null);
          passcode.setErrors(usingPin ? Validators.required : null);
          this.cdr.detectChanges();
        })
      )
      .subscribe();
  }

  listenExtension(): void {
    this.extensionQuery
      .selectActive()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(ext => !!ext && ext instanceof Extension),
        map(ext => ext as Extension),
        distinctUntilKeyChanged('extKey'),
        tap((ext: Extension) => {
          this.extension = ext;
          const hasSchedule = !!this.scheduleQuery.getByIdentityUuid(ext.identityUuid);
          if (!hasSchedule) {
            this.scheduleService.getSchedule(ext.identityUuid).subscribe();
          }
          this.orgMemberService.getPolicyDocument(X.orgUuid, ext.identityUuid).subscribe(policy => {
            this.policy = policy;
            this.form
              .get('permissionCheckboxes')
              .get('allowAccessCR')
              .setValue(!policy.hasGrantedActionPermission(IAM_SERVICES.ui, IAM_UI_ACTIONS.hide_call_recording));
            this.form
              .get('permissionCheckboxes')
              .get('allowDNC')
              .setValue(policy.hasGrantedActionPermission(IAM_SERVICES.dnc, IAM_DNC_ACTIONS.update_setting));
          });

          this.orgLinkService.getGroups(ext.identityUuid).subscribe(orgLinks => {
            this.orgLinks = [];
            const orgLinkGroupsActive = orgLinks
              .filter(g => !g.organizations.some(x => !x.name))
              .map(x => x.organizations)
              .reduce((pre, next) => pre.concat(next), [])
              .filter(x => x.uuid !== X.orgUuid);
            this.orgLinks = [...new Set(_.sortBy(orgLinkGroupsActive, 'name'))];
          });

          this.personalWhitelistService.getByIdentityUuid(ext.identityUuid).subscribe(res => {
            this.form.get('featureCheckboxes').get('enableWhitelist').setValue(res.enabled);
          });
        })
      )
      .subscribe();
  }

  setActivatedDevices(activatedDevices: ExtDevice[]): void {
    this.activatedDevices = activatedDevices;
  }

  setEditingDevices(editingDevices: HashMap<ExtDevice>): void {
    this.editingDevices = editingDevices;
  }

  setRingConfig(ringConfig: RingConfig): void {
    this.ringConfig = ringConfig;
  }

  async apply(): Promise<void> {
    this.loading = true;

    const cloneExtension = { ...this.extension } as Extension;
    cloneExtension.transferCallerIdConfig = this.getForwardingAndTransfer(cloneExtension);

    this.getRingConfig(cloneExtension);

    const updateExtDeviceReqs$ = this.getTLSSTUN(cloneExtension.extKey);

    for (const req$ of updateExtDeviceReqs$) {
      await req$.toPromise();
    }

    const { inbound, outbound, permissionCheckboxes, featureCheckboxes, passcode } = this.form.controls;
    const ext: Partial<Extension> = {
      transferCallerIdConfig: cloneExtension.transferCallerIdConfig,
      devices: this.activatedDevices,
      incomingCallRule: inbound.value,
      outgoingCallRule: outbound.value,
      enableDebugMode: featureCheckboxes.value.enableDebugMode,
      enableAndroidBackgroundMode: featureCheckboxes.value.enableAndroidBackground,
      pin: {
        usingPin: featureCheckboxes.value.usingPin,
        passCode: passcode.value
      },
      crConfig: { ...this.extension.crConfig, isConfigurable: permissionCheckboxes.value.allowCallRecording }
    };

    if (this.ringConfig) {
      ext.ringConfig = this.ringConfig;
    }

    this.updateExtension(cloneExtension.extKey, ext);
    this.updatePublicHoliday();
    this.updatePolicy();
    this.updateWhitelist();
  }

  getForwardingAndTransfer(cloneExtension: Extension): TransferCallerIdConfig {
    const { internal, external, forwardInternal, forwardExternal, permissionCheckboxes } = this.form.controls;
    const cloneTransferCallerIdConfig = { ...cloneExtension.transferCallerIdConfig };

    cloneTransferCallerIdConfig.internal = internal.value;
    cloneTransferCallerIdConfig.external = external.value;
    cloneTransferCallerIdConfig.forwardInternal = forwardInternal.value;
    cloneTransferCallerIdConfig.forwardExternal = forwardExternal.value;
    cloneTransferCallerIdConfig.allowPrivateCallerId = permissionCheckboxes.value.allowPrivateCallerId;

    return cloneTransferCallerIdConfig;
  }

  getRingConfig(cloneExtension: Extension): void {
    if (this.ringConfig) {
      this.ringConfig.version = 'v2';
    } else {
      this.ringConfig = { ...cloneExtension.ringConfig };
    }

    this.ringConfig.activatedDevices = this.activatedDevices
      .filter(x => this.ringConfig.activatedDevices.indexOf(x.deviceType) > -1)
      .map(x => x.deviceType);

    this.ringConfig.enableCallWaiting = this.form.controls['featureCheckboxes'].value.enableCallWaiting;
  }

  getTLSSTUN(extKey: string): Observable<void>[] {
    return Object.keys(this.editingDevices).map(type => {
      const d = this.editingDevices[type];
      const req = <UpdateExtDevice>{
        protocol: d.sipAccount.protocol,
        serverPort: d.sipAccount.serverPort,
        codec: d.sipAccount.codec,
        stunServer: d.sipAccount.stunServer
      };

      return this.extensionService
        .updateExtDevice({ extKey, deviceType: d.deviceType, sipUsername: d.sipAccount.username }, req)
        .pipe(catchError(_ => of(null)));
    });
  }

  updateExtension(extKey: string, ext: Partial<Extension>): void {
    this.extensionService
      .update(extKey, ext)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        _ => {
          this.toastr.success('Apply successfully!');
        },
        error => {
          this.toastr.warning(error.message || DEFAULT_WARNING_MESSAGE);
        }
      );
  }

  updateAssignedNumbers(numbers: string[]) {
    this.extension = {
      ...this.extension,
      transferCallerIdConfig: { ...this.extension.transferCallerIdConfig, assignedCallerIds: numbers }
    } as Extension;
  }

  import() {
    this.dialog.open(ImportCsvComponent, {
      width: '450px'
    });
  }

  export() {
    this.loadingExport = true;
    this.extensionService
      .export()
      .pipe(finalize(() => (this.loadingExport = false)))
      .subscribe(res => {
        downloadData(new Blob([res.body], { type: 'text/csv;charset=utf-8;' }), 'extension');
      });
  }

  configPermission() {
    this.dialog
      .open(ConfigPermissionComponent, {
        width: '500px',
        data: <PermissionDialogInput>{
          memberUuid: this.extension.identityUuid,
          policy: this.policy,
          orgLinks: this.orgLinks
        },
        disableClose: true,
        autoFocus: false
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.policy = res;
        }
      });
  }

  private updateWhitelist() {
    const isEnableWhitelist = this.form.get('featureCheckboxes').get('enableWhitelist').value;
    this.personalWhitelistService.getByIdentityUuid(this.extension.identityUuid).subscribe(res => {
      const currentWhitelist = res.enabled;
      if (isEnableWhitelist != currentWhitelist) {
        if (isEnableWhitelist) {
          this.personalWhitelistService.update(this.extension.identityUuid).subscribe(
            _ => {},
            err => {
              this.toastr.error(err.message);
              this.form.get('featureCheckboxes').get('enableWhitelist').setValue(currentWhitelist);
            }
          );
        } else {
          this.personalWhitelistService.delete(this.extension.identityUuid).subscribe(
            _ => {},
            err => {
              this.toastr.error(err.message);
              this.form.get('featureCheckboxes').get('enableWhitelist').setValue(currentWhitelist);
            }
          );
        }
      }
    });
  }

  private updatePolicy() {
    const isDisabledAccessCR = !this.form.get('permissionCheckboxes').get('allowAccessCR').value;
    const currentDisabledAccessCR = this.policy.hasGrantedActionPermission(
      IAM_SERVICES.ui,
      IAM_UI_ACTIONS.hide_call_recording
    );

    const isCheckedDNC = this.form.get('permissionCheckboxes').get('allowDNC').value;
    const currentDNCControl = this.policy.hasGrantedActionPermission(IAM_SERVICES.dnc, IAM_DNC_ACTIONS.update_setting);

    if (isDisabledAccessCR != currentDisabledAccessCR) {
      if (isDisabledAccessCR) {
        this.policy.policies.push(<IAMGrantedPermission>{
          service: IAM_SERVICES.ui,
          action: IAM_UI_ACTIONS.hide_call_recording,
          resources: ['*']
        });
      } else {
        const iamIndex = this.policy.policies.findIndex(
          p => p.isService(IAM_SERVICES.ui) && p.hasAction(IAM_UI_ACTIONS.hide_call_recording)
        );
        if (iamIndex > -1) {
          this.policy.policies.splice(iamIndex, 1);
        }
      }
    }

    if (isCheckedDNC != currentDNCControl) {
      if (isCheckedDNC) {
        this.policy.policies.push(<IAMGrantedPermission>{
          service: IAM_SERVICES.dnc,
          action: IAM_DNC_ACTIONS.update_setting,
          resources: ['*']
        });
      } else {
        const iamIndex = this.policy.policies.findIndex(
          p => p.isService(IAM_SERVICES.dnc) && p.hasAction(IAM_DNC_ACTIONS.update_setting)
        );
        if (iamIndex > -1) {
          this.policy.policies.splice(iamIndex, 1);
        }
      }
    }

    this.orgMemberService.updatePolicyDocument(X.orgUuid, this.extension.identityUuid, this.policy).subscribe(
      res => {
        this.policy = res;
      },
      error => {
        this.toastr.error(error.message);
        this.form
          .get('permissionCheckboxes')
          .get('allowAccessCR')
          .setValue(!this.policy.hasGrantedActionPermission(IAM_SERVICES.ui, IAM_UI_ACTIONS.hide_call_recording));
        this.form
          .get('permissionCheckboxes')
          .get('allowDNC')
          .setValue(this.policy.hasGrantedActionPermission(IAM_SERVICES.dnc, IAM_DNC_ACTIONS.update_setting));
      }
    );
  }

  private updatePublicHoliday() {
    if (this.publicHoliday.formConfig.dirty) {
      const schedule = this.scheduleQuery.getByIdentityUuid(this.extension.identityUuid);
      this.scheduleService
        .updateSchedule(this.extension.identityUuid, {
          ...schedule,
          ...this.publicHoliday.formConfig.value
        })
        .subscribe(
          _ => {},
          err => this.toastr.error(err.message)
        );
    }
  }

  toggleNoMember(isNoMember: boolean) {
    this.noMember = isNoMember;
  }
}
