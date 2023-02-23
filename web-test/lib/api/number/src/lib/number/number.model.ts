import { HttpParams } from '@angular/common/http';

export class FindNumberReq {
  keyword?: string;
  capabilities?: string[];
  productId?: string;
  sku?: string;
  appIds?: string[];
  subscriptionUuids?: string[];
  states?: string;

  constructor(obj?: Partial<FindNumberReq>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  toParams(): HttpParams {
    let params = new HttpParams();
    if (this.keyword) {
      params = params.set('keyword', this.keyword);
    }
    if (this.capabilities) {
      params = params.set('capabilities', this.capabilities.join(','));
    }
    if (this.productId) {
      params = params.set('productId', this.productId);
    }
    if (this.sku) {
      params = params.set('sku', this.sku);
    }
    if (this.appIds) {
      params = params.set('appIds', this.appIds.join(','));
    }
    if (this.subscriptionUuids) {
      params = params.set('subscriptionUuids', this.subscriptionUuids.join(','));
    }
    if (this.states) {
      params = params.set('states', this.states);
    }
    return params;
  }
}

export class B3Number {
  number: string;
  country: string;
  capability: string;
  productId: string;
  appId: string;
  expiryTime: string;
  subscriptionUuid: string;
  state: string;
  sku: string;
  ownerOrgUuid: string;

  constructor(obj?: Partial<B3Number>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class CheckDocumentResult {
  sku: string;
  valid: boolean;
}

// Store
export class NumberCapability {
  voice: boolean;
  sms: boolean;
  fax: boolean;

  constructor(parameters?: any) {
    this.voice = parameters.voice;
    this.sms = parameters.sms;
    this.fax = parameters.fax;
  }

  getString(): string {
    const tmp = [];
    if (this.voice) {
      tmp.push('voice');
    }

    if (this.sms) {
      tmp.push('sms');
    }

    if (this.fax) {
      tmp.push('fax');
    }

    return tmp.join(',').toUpperCase();
  }
}

export class NumberResponse {
  number: string;
  pricingCode: string;
  state: string;
  capability: NumberCapability;
  expiryTime: string;
  subscriptionUuid: string;
  numberState: string;
}

export class AssignNumberRequest {
  action = 'assign';

  constructor(public data: AssignNumberData, public remarks: string) {}
}

export class AssignNumberData {
  constructor(public appUuid: string, public subscriptionUuid: string) {}
}

export class ReserveNumberRequest {
  action = 'reserve';
  constructor(public data: ReserveNumberData, public remarks: string) {}
}

export class ReserveNumberData {
  constructor(public duration: ReserveNumberDuration) {}
}

export class ReserveNumberDuration {
  // {Hours, Minutes, ... }
  constructor(public value: number, public type: string) {}
}
