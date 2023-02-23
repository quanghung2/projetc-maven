import { Change } from '../common/common-audit.model';

export class BizPhoneAuditDetails {
  ipAddress?: string;
  changes: Change[] = [];
  constructor(obj?: Partial<BizPhoneAuditDetails>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
