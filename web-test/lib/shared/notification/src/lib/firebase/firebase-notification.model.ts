export interface NotificationData {
  appIconUrl: string;
  appId: string;
  orgUuid: string;
  eventTime: number;
  notificationData: any;
  popupMessage: string;
}

export interface FirebaseNotification {
  collapse_key: string;
  data: NotificationData;
  from: string;
  priority: string;
}
