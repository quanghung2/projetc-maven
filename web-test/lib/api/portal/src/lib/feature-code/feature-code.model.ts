export enum PortalFeatureCode {
  new_landing = 'new_landing',
  new_organization_home = 'new_organization_home',
  unified_workspace = 'unified_workspace',
  dashboard = 'dashboard',
  flow = 'flow',

  // feature code for org-management app
  org_api = 'api',
  org_webhooks = 'webhooks',
  org_myinfo = 'myinfo',

  show_subscription_basic_menu = 'show_subscription_basic_menu'
}

export interface FeatureCode {
  id: string;
  orgUuid: string;
  featureCode: string;
}

export function createFeatureId(orgUuid, code: string) {
  return `${orgUuid}_${code}`;
}

export function createFeatureCode(params: Partial<FeatureCode>) {
  return {} as FeatureCode;
}
