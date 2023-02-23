import { Block, BlockType } from './block';
import { WebhookCommand } from './webhook-block';

export class NotifyBlock extends Block {
  email: EmailDetails = new EmailDetails();
  sms: SmsDetails = new SmsDetails();
  emailType: EmailType;
  smsType: SmsType;
  enableVoiceMail: boolean;

  constructor(params?: any) {
    super(params);

    if (params) {
      this.email = new EmailDetails(params.email);
      this.sms = new SmsDetails(params.sms);
      this.emailType = params.emailType;
      this.smsType = params.smsType;

      this.enableVoiceMail = params.enableVoiceMail;
      this.webHookCommand = new WebhookCommand(params.webHookCommand);
    }

    if (!this.emailType) {
      this.emailType = EmailType.none;
    }
    if (!this.smsType) {
      this.smsType = SmsType.none;
    }

    this.type = BlockType.notification;
  }
}

export class EmailDetails {
  emailAddresses: string[] = [];

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export class SmsDetails {
  customSmsAddress: string;
  smsSender: string;
  smsMessage: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export enum EmailType {
  none = 'none',
  custom = 'custom'
}

export enum SmsType {
  none = 'none',
  caller = 'caller',
  last_input_number = 'last_input_number',
  custom = 'custom'
}
