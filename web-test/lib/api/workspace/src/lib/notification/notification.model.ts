export enum NotificationMode {
  all = 'all',
  none = 'none',
  default = 'default'
}

export class NotificationSettings {
  notification_setting: NotificationMode = NotificationMode.default;
  keywords: string[] = [];
}

export class PunubChannel {
  public read: string;
  public write: string;
}
