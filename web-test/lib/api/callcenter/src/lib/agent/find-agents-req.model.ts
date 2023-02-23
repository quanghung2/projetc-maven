import { HttpParams } from '@angular/common/http';

export class FindAgentsReq {
  queues: string[] = [];
  excludeNonExtension: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  toParams(): HttpParams {
    let params = new HttpParams();
    if (this.queues && this.queues.length > 0) {
      params = params.set('queues', this.queues.join(','));
    }
    if (this.excludeNonExtension) {
      params = params.set('excludeNonExtension', this.excludeNonExtension);
    }
    return params;
  }
}
