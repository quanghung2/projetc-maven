import { MailBox } from '@b3networks/api/bizphone';
import { SortDirection } from '@b3networks/api/common';
import { CallflowConfig } from '../queue/queue.model';

export interface GetExtGroupReq {
  keyword?: string;
  sort?: SortDirection;
}

export class ExtensionGroup {
  extKey: string;
  extLabel: string;
  extList: string[];
  callflowConfig: CallflowConfig;
  mailBox: MailBox;

  get extListSorted() {
    return this.extList.map(x => +x).join(', ');
  }

  constructor(obj?: Partial<ExtensionGroup>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
