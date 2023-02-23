import { TOOLTIP_ACTION_PERMISSION } from './iam.constant';

export enum IAMScope {
  system = 'SYSTEM',
  organization = 'ORGANIZATION',
  cpassOrganization = 'ORGANIZATION_CPAAS',
  adminOrganization = 'ADMIN_ORGANIZATION',
  domain = 'DOMAIN'
}

export interface ServiceDetails {
  name: string;
  description: string;
  scopes: IAMScope[];
}

export interface ActionDetails {
  name: string;
  desc: string;
  type: string;
  scopes: IAMScope[];
}

export class IAMPermission {
  service: ServiceDetails;
  actions: ActionDetails[];

  constructor(obj?: Partial<IAMPermission>) {
    if (obj) {
      Object.assign(this, obj);
    }
    this.actions = this.actions || [];
  }

  getActions(scope: IAMScope) {
    return this.actions.filter(a => a.scopes.indexOf(scope) > -1);
  }
}

export class IAMGrantedPermission {
  id: string; // client generated id for storing purpose
  service: '*' | string;
  action: '*' | string;
  resources: string[];
  disabled?: boolean;

  constructor(obj?: Partial<IAMGrantedPermission>) {
    if (obj) {
      Object.assign(this, obj);
      this.id = `${this.service}_${this.action}`;
    }
  }

  get isAllowedAllActions() {
    return this.action === '*';
  }

  get isAllowedAllResources() {
    return this.resources.indexOf('*') > -1;
  }

  get displayText() {
    return this.action?.replace(/([A-Z])/g, ' $1').trim();
  }

  get tooltip() {
    return TOOLTIP_ACTION_PERMISSION[this.action];
  }

  isService(service: string) {
    return this.service === '*' || this.service === service;
  }

  hasAction(action: string) {
    return this.isAllowedAllActions || this.action === action;
  }

  hasResource(resource: string) {
    return this.resources.indexOf('*') > -1 || this.resources.indexOf(resource) > -1;
  }

  isAllowedAction(service, action: string) {
    return this.isService(service) && this.hasAction(action) && this.resources?.length > 0;
  }

  isAllowResource(service, action, resource: string) {
    return this.isAllowedAction(service, action) && this.hasResource(resource);
  }
}

export interface IAMGroup {
  description: string;
  name: string;
  uuid: string;
}

export interface UpdateIAMGroupMemberReq {
  adds?: string[];
  removes?: string[];
}
