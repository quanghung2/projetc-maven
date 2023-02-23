import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { KeyValue } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import {
  CallFlow,
  EmailType,
  NotificationSetting,
  SettingsService,
  SettingStatus,
  SettingType,
  User,
  UserService
} from '@b3networks/api/ivr';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-notification-setting',
  templateUrl: './notification-setting.component.html',
  styleUrls: ['./notification-setting.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NotificationSettingComponent implements OnInit, OnChanges {
  @Input() setting: NotificationSetting = new NotificationSetting();
  @Input() flow: CallFlow;
  @Output() refreshSettingsEvent = new EventEmitter<any>();
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  listEmailAddress: string[] = [];
  emailTypeOptions: KeyValue<EmailType, string>[] = [
    { key: EmailType.none, value: 'None' },
    { key: EmailType.custom, value: 'Custom' }
  ];

  user: User = new User();
  saving: boolean;
  form: FormGroup;

  constructor(
    private toastService: ToastService,
    private settingsService: SettingsService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.userService.fetchUser().subscribe(user => (this.user = user));
    this.listEmailAddress = this.setting.data.email.emailAddresses;
    this.form = new FormGroup({
      email: new FormControl('', [Validators.email])
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.setting) {
      let params: any = {
        type: SettingType[SettingType.notification],
        flowUuid: this.flow.uuid,
        orgUuid: this.flow.orgUuid,
        status: SettingStatus[SettingStatus.active]
      };
      this.setting = new NotificationSetting(params);
    }
  }

  save() {
    if (this.setting.data.emailType === EmailType.custom && this.setting.data.email.emailAddresses.length === 0) {
      this.toastService.error('Please enter email!.');
      return;
    }

    this.saving = true;
    this.settingsService.saveSettings(this.flow.uuid, [this.setting]).subscribe(
      (data: any) => {
        this.refreshSettingsEvent.emit(data);
        this.saving = false;
        this.toastService.success('Saved. This update will take effect after 5 minutes.');
      },
      (err: any) => {
        this.toastService.error('Error happened while saving notification setting..');
        this.saving = false;
      }
    );
  }

  remove(emailAddress: string) {
    const index = this.listEmailAddress.indexOf(emailAddress);

    if (index >= 0) {
      this.listEmailAddress.splice(index, 1);
      this.setting.data.email.emailAddresses = this.listEmailAddress;
    }
  }

  add(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      this.listEmailAddress.push(value);
      this.setting.data.email.emailAddresses = this.listEmailAddress;
    }
    if (input) {
      input.value = '';
    }
  }
}
