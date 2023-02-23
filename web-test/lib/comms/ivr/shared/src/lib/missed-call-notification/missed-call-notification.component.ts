import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CallerIdService } from '@b3networks/api/callerid-verification';
import {
  EmailType,
  NotificationSettingsResponse,
  SensitiveSettings,
  SettingStatus,
  SettingsService,
  SmsType
} from '@b3networks/api/ivr';
import { X } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { finalize, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'b3n-missed-call-notification',
  templateUrl: './missed-call-notification.component.html',
  styleUrls: ['./missed-call-notification.component.scss'],
  providers: [SettingsService]
})
export class MissedCallNotificationComponent implements OnInit {
  readonly tabs: KeyValue<string, string>[] = [
    { key: 'notification', value: 'Missed call notification' },
    { key: 'placeholder', value: 'Placeholder map' }
  ];

  smsTypeOptions: KeyValue<SmsType, string>[] = [
    { key: SmsType.none, value: 'None' },
    { key: SmsType.caller, value: 'Caller' },
    { key: SmsType.last_input_number, value: 'Last Input Number' },
    { key: SmsType.custom, value: 'Custom' }
  ];

  missedCallNotificationSettings: NotificationSettingsResponse;
  notificationStatus: boolean;
  query: string;
  SmsType = SmsType;
  senderNumbers: string[] = [];
  workflowUuid: string;
  progressing: boolean;
  emailAddresses: string;
  sensitiveSettings: SensitiveSettings;

  constructor(
    private settingService: SettingsService,
    private spinner: LoadingSpinnerSerivce,
    private route: ActivatedRoute,
    private infraService: CallerIdService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.spinner.showSpinner();
    this.route.params
      .pipe(
        mergeMap(params => {
          this.workflowUuid = params[`uuid`];
          return forkJoin([
            this.settingService.fetchMissedCallNotificationSettings(params[`uuid`]),
            this.infraService.findSenders(X.orgUuid),
            this.settingService.getSensitiveSettings(params['uuid'])
          ]);
        })
      )
      .subscribe(
        (data: any) => {
          this.missedCallNotificationSettings = data[0];
          this.emailAddresses = this.missedCallNotificationSettings.data.email.emailAddresses.join(',');
          if (this.missedCallNotificationSettings.status === SettingStatus[SettingStatus.active]) {
            this.notificationStatus = true;
          } else {
            this.notificationStatus = false;
          }
          this.senderNumbers = [].concat(...data[1].map(d => d.sender)).sort((a, b) => a.localeCompare(b));
          this.sensitiveSettings = data[2];
          this.spinner.hideSpinner();
        },
        err => {
          this.toastService.error(`Cannot fetch settings. Please try again later!`);
          this.spinner.hideSpinner();
        }
      );
  }

  onChangeEmailAddresses(value: string) {
    if (value == '') {
      this.missedCallNotificationSettings.data.emailType = EmailType.none;
    } else {
      this.missedCallNotificationSettings.data.emailType = EmailType.custom;
    }
    if (value && value.length > 0) {
      this.missedCallNotificationSettings.data.email.emailAddresses = value.split(',');
    } else {
      this.missedCallNotificationSettings.data.email.emailAddresses = [];
    }
  }

  progress() {
    this.progressing = true;
    const updateSettings = Object.assign({}, this.missedCallNotificationSettings);
    const storePressedKeys = Object.assign({}, this.sensitiveSettings);
    this.settingService
      .saveAllSettings(this.workflowUuid, [updateSettings, storePressedKeys])
      .pipe(
        finalize(() => {
          this.progressing = false;
        })
      )
      .subscribe(
        result => this.toastService.success(`Saved settings successfully!`),
        err => this.toastService.error(`Cannot save settings. Please try again later!`)
      );
  }

  onChangeStatus(status: boolean) {
    this.notificationStatus = status;
    if (this.notificationStatus) {
      this.missedCallNotificationSettings.status = SettingStatus[SettingStatus.active];
    } else {
      this.missedCallNotificationSettings.status = SettingStatus[SettingStatus.inactive];
    }
  }

  clearEmail() {
    this.emailAddresses = '';
    this.missedCallNotificationSettings.data.email.emailAddresses = null;
    this.missedCallNotificationSettings.data.emailType = EmailType.none;
  }

  storePressedKeysChanged(storePressedKeys: boolean) {
    this.sensitiveSettings.data.storePressedDigits = storePressedKeys;
  }
}
