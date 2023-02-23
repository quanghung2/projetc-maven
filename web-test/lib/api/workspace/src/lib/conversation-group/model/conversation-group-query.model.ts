import { HttpParams } from '@angular/common/http';
import { GroupType, Privacy, Status } from '../../enums.model';

export class GetConvoGroupReq {
  privacy: Privacy[] = [];
  status: Status[] = [];
  convoType: GroupType[] = [];
  search: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  getHttpParam(): HttpParams {
    let params = new HttpParams();

    if (this.privacy.length > 0) {
      params = params.set('privacy', this.privacy.join(','));
    }
    if (this.status.length > 0) {
      params = params.set('status', this.status.join(','));
    }
    if (this.convoType.length > 0) {
      params = params.set('type', this.convoType.join(','));
    }
    if (!!this.search) {
      params = params.set('search', this.search);
    }

    return params;
  }
}
