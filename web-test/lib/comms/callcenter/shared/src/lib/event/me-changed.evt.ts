import { Me } from '@b3networks/api/callcenter';
import { EventMessage } from '@b3networks/shared/utils/message';

export class MeStatusChanged implements EventMessage {
  me: Me;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export class MeLicenseChangedEvent implements EventMessage {
  me: Me;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
