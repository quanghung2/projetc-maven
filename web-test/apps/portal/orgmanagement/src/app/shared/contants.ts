import { DEV_LINK } from '@b3networks/portal/org/feature/developer';
import { PORTAL_SETTING_ROUTE_LINK } from '@b3networks/portal/org/feature/settings';

export enum ROUTE_LINK {
  members = 'members',
  teams = 'teams',
  payment = 'payment',
  subscriptions = 'subscriptions',
  licenses = 'license',
  invoices = 'invoice',
  usage_history = 'usage-history',
  transactions = 'transactions',
  audit = 'audit',
  call_history = 'call-history',
  reports = 'reports',
  settings = 'settings',
  public_holiday = 'public-holiday',
  inbound_call_rule = 'inbound-call-rule',
  outbound_call_rule = 'outbound-call-rule',

  developer = 'developer',
  compliance = 'compliance',
  org_link = 'org-link',
  hyperspace_management = 'hyperspace-management'
}

export const ROUTES_MAP = {
  audit: { key: ROUTE_LINK.audit, value: 'Audit' },
  members: { key: ROUTE_LINK.members, value: 'Members' },
  teams: { key: ROUTE_LINK.teams, value: 'Teams' },

  payment: { key: ROUTE_LINK.payment, value: 'Payment' },
  subscriptions: { key: ROUTE_LINK.subscriptions, value: 'Subscriptions' },
  licenses: { key: ROUTE_LINK.licenses, value: 'Licenses' },
  invoices: { key: ROUTE_LINK.invoices, value: 'Invoices' },
  usage_history: { key: ROUTE_LINK.usage_history, value: 'Usage History' },
  transactions: { key: ROUTE_LINK.transactions, value: 'Transactions' },
  public_holiday: { key: ROUTE_LINK.public_holiday, value: 'Public Holiday' },
  inbound_call_rule: { key: ROUTE_LINK.inbound_call_rule, value: 'Inbound Call Rule' },
  outbound_call_rule: { key: ROUTE_LINK.outbound_call_rule, value: 'Outbound Call Rule' },

  billing_address: { key: ROUTE_LINK.settings + '/' + PORTAL_SETTING_ROUTE_LINK.address, value: 'Address' },
  myinfo: { key: ROUTE_LINK.settings + '/' + PORTAL_SETTING_ROUTE_LINK.myinfo, value: 'Digital Identity' },

  // support for subscription pricing only
  call_history: { key: ROUTE_LINK.call_history, value: 'Call History' },
  report: { key: ROUTE_LINK.reports, value: 'Report' },
  compliance: { key: ROUTE_LINK.compliance, value: 'Compliance' },
  org_link: { key: ROUTE_LINK.org_link, value: 'Organization Connect' },
  hyperspace_management: { key: ROUTE_LINK.hyperspace_management, value: 'Workspace Connect' }
};

// subscription pricing only
export const DEVELOPER_MAPS = {
  apiKeys: { key: ROUTE_LINK.developer + '/' + DEV_LINK.api_keys, value: 'API Keys' },
  webhooks: { key: ROUTE_LINK.developer + '/' + DEV_LINK.webhooks, value: 'Webhooks' }
};

export const RIGHT_SIDEBAR_ID = 'RIGHT_SIDEBAR_ID';
