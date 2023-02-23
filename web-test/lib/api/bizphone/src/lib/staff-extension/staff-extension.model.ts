import { ExtensionRole, ExtType } from '../enums';
import { Extension } from '../extension/model/extension.model';

export class StaffExtension {
  callerId: string;
  extKey: string;
  extLabel: string;
  identityUuid: string;
  orgUuid: string;
  role: ExtensionRole;
  type: ExtType;
  extension: Extension;

  constructor(obj?: Partial<StaffExtension>) {
    if (obj) {
      Object.assign(this, obj);
      if (obj.extension) {
        this.extension = new Extension(obj.extension);
      }
    }
  }
}
