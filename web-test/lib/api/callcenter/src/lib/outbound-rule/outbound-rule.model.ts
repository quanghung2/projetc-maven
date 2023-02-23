import { HashMap } from '@datorama/akita';

export enum CountryWhiteListAction {
  BYPASS = 'bypass',
  ASK_PASSCODE = 'askPasscode'
}

export class CountryWhiteListV2 {
  code: string;
  action: CountryWhiteListAction;
  label: string;

  constructor(obj?: Partial<CountryWhiteListV2>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  getCountryCode() {
    const splitedCode = this.code.split('.');
    return splitedCode[0];
  }

  getAreaCode() {
    const splitedCode = this.code.split('.');
    return splitedCode.length > 1 ? splitedCode[1] : '';
  }

  updateCode(country: string, area: string) {
    this.code = area ? [country, area].join('.') : country;
    return this.code;
  }

  updateAction(passcode: boolean) {
    this.action = passcode ? CountryWhiteListAction.ASK_PASSCODE : CountryWhiteListAction.BYPASS;
    return this.action;
  }
}

export interface UpdateOutboundRuleResp {
  countryWhiteList?: object;
  name?: string;
  pinWhiteList?: string[];
  status?: EntityStatus;
  countryWhiteListV2?: CountryWhiteListV2[];
}

export class OutboundRule {
  countryWhiteList: string[];
  createdTime: number;
  id: number;
  name: string;
  orgUuid: string;
  pinWhiteList: string[];
  sipGwList: string[];
  status: EntityStatus;
  orgLinkConfig: RuleOrgLinkConfig;
  countryWhiteListV2: CountryWhiteListV2[];

  constructor(obj?: Partial<OutboundRule>) {
    if (obj) {
      if (obj.countryWhiteListV2) {
        obj.countryWhiteListV2 = obj.countryWhiteListV2.map(c => new CountryWhiteListV2(c));
      }

      Object.assign(this, obj);
    }
  }
}

export class RuleOrgLinkConfig {
  orgLinks: HashMap<{
    groupUuid: string;
    prefix: string;
  }>;
}

export interface StatusResp {
  status: string;
}

export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export class DialPlanDetail {
  startWith: string[] = [];
  numberLength: string[] = [];
  removePrefix: number;
  appendPrefix: string;
  sipGatewayEndpoint: string;
  orgLinkConfigs: OrgLinkConfig[];

  constructor(obj?: Partial<DialPlanDetail>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
export class DialPlanV3 {
  id: number;
  outGoingCallRuleId: number;
  planDetail: DialPlanDetail;
  status: EntityStatus;
  isEditing: boolean;

  constructor(obj?: Partial<DialPlanV3>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class CountryOutboundRule {
  id: string;
  name: string;
  code: string;
  passcode?: boolean;
  ISO2?: string;
  areaCode?: string;
  areaLabel: string;

  constructor(obj?: Partial<CountryOutboundRule>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  getLocationWithCode() {
    return this.areaCode ? `${this.name} - ${this.areaCode}` : this.name;
  }

  getLocationWithLabel() {
    return this.areaLabel ? `${this.name} - ${this.areaLabel}` : this.name;
  }

  getLocationCode() {
    return this.areaCode ? `${this.ISO2}.${this.areaCode}` : this.ISO2;
  }
}

export enum UpdateCountryAction {
  'ADD' = 'ADD',
  'REMOVE' = 'REMOVE',
  'EDIT' = 'EDIT'
}

export class MasterDialPlan {
  id: string;
  countryCode: string;
  planDetail: DialPlanDetail;
  isChecked: boolean;

  constructor(obj?: any) {
    if (obj) {
      if (obj.planDetail) {
        obj.planDetail = new DialPlanDetail(obj.planDetail);
      }

      Object.assign(this, obj);
    }
  }
}

export class OrgLinkConfig {
  prefix: string;
  orgUuid: string;
  orgGroupUuid: string;
  enable: boolean;
  name: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
