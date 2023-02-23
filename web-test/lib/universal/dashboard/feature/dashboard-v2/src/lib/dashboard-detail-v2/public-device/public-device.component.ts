import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Dashboard2, Dashboard2Map, DashboardV2Service, DASHBOARD_TYPE, PublicDevice } from '@b3networks/api/dashboard';
import { arrMinLengthValidator, DestroySubscriberComponent } from '@b3networks/shared/common';
import { cloneDeep } from 'lodash';
import { combineLatest, firstValueFrom } from 'rxjs';
import { startWith, takeUntil, tap } from 'rxjs/operators';

export type PublicDeviceForm = FormGroup<{
  selectDashboardForm: SelectDashboardForm;
  otpVerifyForm: OtpVerifyForm;
  deviceVerifyForm: DeviceVerifyForm;
}>;

export type SelectDashboardForm = FormGroup<{
  dashboardUuids: FormControl<string[]>;
  search: FormControl<string>;
  type: FormControl<number>;
}>;

export type OtpVerifyForm = FormGroup<{
  digit0: FormControl<string>;
  digit1: FormControl<string>;
  digit2: FormControl<string>;
  digit3: FormControl<string>;
  digit4: FormControl<string>;
  digit5: FormControl<string>;
}>;

export type DeviceVerifyForm = FormGroup<{
  name: FormControl<string>;
}>;

@Component({
  selector: 'b3n-public-device',
  templateUrl: './public-device.component.html',
  styleUrls: ['./public-device.component.scss']
})
export class PublicDeviceComponent extends DestroySubscriberComponent implements OnInit {
  form: PublicDeviceForm;
  dashboard2s: Dashboard2[] = [];
  dashboard2sFilter: Dashboard2[] = [];
  dashboard2Map: Dashboard2Map = {};
  disableDashboardOptions: boolean;
  dashboardOptionLeft: number;
  maxAccessDashboard: number;
  maxAccessDevice: number;
  publicDevices: PublicDevice[] = [];
  loading: boolean;
  invalid: boolean;
  verifiedDevice: PublicDevice;

  readonly DASHBOARD_TYPE = DASHBOARD_TYPE;

  constructor(
    public dialogRef: MatDialogRef<PublicDeviceComponent>,
    private fb: FormBuilder,
    private dashboardV2Service: DashboardV2Service
  ) {
    super();
  }

  async ngOnInit(): Promise<void> {
    this.maxAccessDashboard = this.dashboardV2Service.globalConfig.maxAccessDashboard;
    this.maxAccessDevice = this.dashboardV2Service.globalConfig.maxAccessDevice;
    this.dashboardOptionLeft = this.maxAccessDashboard;
    this.initForm();
    this.publicDevices = await firstValueFrom(this.dashboardV2Service.getPublicDevices());

    if (this.publicDevices.length >= this.maxAccessDevice) {
      return;
    }

    this.dashboard2s = await firstValueFrom(this.dashboardV2Service.getDashboards());
    this.dashboard2sFilter = cloneDeep(this.dashboard2s);
    this.dashboard2s.forEach(d => {
      this.dashboard2Map[d.uuid] = {
        selected: false
      };
    });
  }

  initForm() {
    this.form = this.fb.group({
      selectDashboardForm: this.fb.group({
        dashboardUuids: [[] as string[], arrMinLengthValidator(1)],
        search: [''],
        type: [this.DASHBOARD_TYPE[0].key]
      }),
      otpVerifyForm: this.fb.group({
        digit0: [''],
        digit1: [''],
        digit2: [''],
        digit3: [''],
        digit4: [''],
        digit5: ['']
      }),
      deviceVerifyForm: this.fb.group({
        name: ['', [Validators.required]]
      })
    });

    combineLatest([this.search.valueChanges.pipe(startWith('')), this.type.valueChanges.pipe(startWith(1))])
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(([search, type]) => {
          const value = (search as string).toLowerCase().trim();
          this.dashboard2sFilter = this.dashboard2s.filter(d => {
            const searchCondition = () => d.name?.toLowerCase().trim().includes(value);
            let filterCondition: () => void;

            switch (type) {
              case 1:
                filterCondition = null;
                break;

              case 2:
                filterCondition = () => d.isDefault;
                break;

              case 3:
                filterCondition = () => !d.isDefault;
                break;
            }

            return filterCondition ? searchCondition() && filterCondition() : searchCondition();
          });
        })
      )
      .subscribe();
  }

  dashboardOptionClick(uuid: string) {
    if (this.disableDashboardOptions && !this.dashboard2Map[uuid].selected) {
      return;
    }

    this.dashboard2Map[uuid].selected = !this.dashboard2Map[uuid].selected;
    const selectedUuids = [];

    for (const uuid in this.dashboard2Map) {
      if (this.dashboard2Map[uuid].selected) {
        selectedUuids.push(uuid);
      }
    }

    this.dashboardOptionLeft = this.maxAccessDashboard - selectedUuids.length;
    this.disableDashboardOptions = selectedUuids.length === this.maxAccessDashboard;
    this.dashboardUuids.setValue(selectedUuids);
  }

  clearDashboardOptions() {
    for (const uuid in this.dashboard2Map) {
      this.dashboard2Map[uuid].selected = false;
    }

    this.dashboardOptionLeft = this.maxAccessDashboard;
    this.disableDashboardOptions = false;
    this.dashboardUuids.setValue([]);
  }

  async submit() {
    const digitObj = this.otpVerifyForm.getRawValue();
    const otp = Object.values(digitObj).join('').toUpperCase();

    if (otp.length !== 6 || !this.dashboardUuids.value.length) {
      return;
    }

    this.loading = true;
    this.invalid = false;

    try {
      this.verifiedDevice = await firstValueFrom(this.dashboardV2Service.approveDevice(otp, this.dashboardUuids.value));
      this.deviceVerifyForm.patchValue({
        name: this.verifiedDevice.deviceName
      });
    } catch (e) {
      this.invalid = true;
      this.otpVerifyForm.patchValue({
        digit0: '',
        digit1: '',
        digit2: '',
        digit3: '',
        digit4: '',
        digit5: ''
      });
    } finally {
      this.loading = false;
    }
  }

  get selectDashboardForm() {
    return this.form.controls['selectDashboardForm'];
  }

  get dashboardUuids() {
    return this.selectDashboardForm.controls['dashboardUuids'];
  }

  get search() {
    return this.selectDashboardForm.controls['search'];
  }

  get type() {
    return this.selectDashboardForm.controls['type'];
  }

  get otpVerifyForm() {
    return this.form.controls['otpVerifyForm'];
  }

  get deviceVerifyForm() {
    return this.form.controls['deviceVerifyForm'];
  }
}
