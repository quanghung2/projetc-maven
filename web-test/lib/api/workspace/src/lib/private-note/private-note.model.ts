import { ID } from '@datorama/akita';
import { MsgType } from '../enums.model';

export class PrivateNote {
  createdAt: number;
  createdBy: string;
  jsonMessage: string;
  msgType: MsgType;
  txnUuid: string; // private note for txn

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get noteId(): ID {
    return this.createdAt + this.createdBy;
  }
}

export class GetRequest {
  constructor(public page: number, public size: number) {}

  public getHttpParam(): any {
    const rs = {};

    if (this.size > 0) {
      rs['page'] = this.page;
      rs['size'] = this.size;
    }

    return rs;
  }
}

export class AddReq {
  constructor(public jsonMessage: string, public msgType: MsgType) {}
}
