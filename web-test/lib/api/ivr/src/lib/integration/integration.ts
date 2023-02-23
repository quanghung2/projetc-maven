export interface CustomFieldParams {
  category: string;
  type: string;
  properties: string;
  selectedCategoryObj: {};
  selectedTypeArr: [];
}

export class Integration {
  AUTHORIZATION_KEY: string = 'Authorization';
  workFlowUuid: string;
  subDomain: string;
  type: IntegrationType;
  registeredEmail: string;
  apiKey: string;
  extra: any = {
    custom_fields: {} = <CustomFieldParams>{}
  };
  updatedAt: string;
  createdAt: string;
  command: CommandExtraParams = <CommandExtraParams>{};
  commonParams: any = {};
  createTicketParams: any = {};
  updateTicketParams: any = {};

  constructor(params?) {
    Object.assign(this, params);
  }
}

export enum IntegrationType {
  zendesk = 'zendesk',
  desk = 'desk',
  freshdesk = 'freshdesk',
  agileCrm = 'agileCrm',
  httpsNotification = 'httpOutgoing',
  genericTicketing = 'genericTicketing'
}

export interface AgileExtraParams {
  priority: string;
  status: string;
  groupID: string;
}

export interface DeskExtraParams {
  priority: string;
  status: string;
  consumerKey: string;
  consumerSecret: string;
  tokenString: string;
  tokenSecret: string;
  customerID: string;
}

export interface ZenDeskExtraparams {
  type: string;
  priority: string;
  status: string;
}

export interface FreshDeskExtraParams {
  type: string;
  priority: number;
  status: number;
  group_id: number;
  custom_fields: CustomFieldParams;
}

export interface WebhookExtraParams {
  createContactURL: string;
  createTicketURL: string;
  password: string;
  searchContactURL: string;
  updateTicketURL: string;
  username: string;
}

export interface CreateTicketParams {
  description: '{{incomingCallMessage}}';
  subject: '{{subject}}';
  type: string;

  [name: string]: string;
}

export class CommandExtraParams {
  headers: {};
  parameters: {};
  method: 'POST';
  url: string;
}
