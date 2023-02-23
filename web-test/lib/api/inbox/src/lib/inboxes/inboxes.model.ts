export class Inbox {
  uuid: string;
  name: string;
  routingMode: RoutingMode;
  queueUuid: string;
  teams: string[];
  createdAt: number;
  updatedAt: number;

  constructor(obj: Partial<Inbox>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface StoreInboxRequest {
  name: string;
  routingMode: RoutingMode;
  queueUuid?: string;
  teams?: string[];
}

export enum RoutingMode {
  manual = 'manual',
  auto = 'auto'
}
