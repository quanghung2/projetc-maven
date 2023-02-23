export class Widget {
  uuid: string;
  orgUuid: string;
  name: string;
  inboxUuid: string;
  createdAt: number;
  updatedAt: number;

  constructor(obj: Partial<Widget>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface StoreWidgetRequest {
  name: string;
  inboxUuid: string;
}
