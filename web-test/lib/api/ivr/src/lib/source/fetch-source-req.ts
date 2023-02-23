import { HttpParams } from '@angular/common/http';

export class FetchSourceReq {
  numbers: string[];
  q: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  toParams(): HttpParams {
    let params = new HttpParams();
    if (this.numbers) {
      params = params.set('numbers', this.numbers.join(','));
    }
    if (this.q) {
      params = params.set('q', this.q);
    }
    return params;
  }
}
