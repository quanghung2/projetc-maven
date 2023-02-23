import { EmailDetails } from '../block/notify-block';
import { WebhookCommand } from '../block/webhook-block';
import { Setting, SettingType } from './setting';

export class NotificationSetting extends Setting {
  public data: NotificationData = new NotificationData();

  constructor(params?: any) {
    super(params);
    if (params) {
      this.data = new NotificationData(params.data);
    }

    this.type = SettingType[SettingType.notification];
  }
}

export class NotificationData {
  public type: string = SettingType[SettingType.notification];
  public email: EmailDetails = new EmailDetails();
  public emailType: string = 'none';
  public webHookCommand: WebhookCommand;

  constructor(params?: any) {
    if (params) {
      this.email = params.email;
      this.emailType = params.emailType;
      this.webHookCommand = new WebhookCommand(params.webHookCommand);
    }
  }
}
