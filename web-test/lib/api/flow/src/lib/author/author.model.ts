import { AuthenticationType, BodyParameter, ConfigStaticDataSource, Output, Parameters } from '../common.model';

export interface ConfigAuthorConnectorInternal {
  vipAddress: string;
}

export interface GlobalAuthConfig {
  type: AuthenticationType;
  key: string;
}

export interface ConfigAuthorConnectorExternal {
  baseURL: string;
  globalAuthConfig: GlobalAuthConfig;
}

export interface CreateAuthorConnectorReq {
  type: string;
  name: string;
  description: string;
  iconUrl: string;
  backgroundColor: string;
  configs: ConfigAuthorConnectorInternal | ConfigAuthorConnectorExternal;
  userParams: Parameters;
  domainVisibility: DomainVisibility;
}

export class AuthorConnector {
  backgroundColor: string;
  configs: ConfigAuthorConnectorInternal | ConfigAuthorConnectorExternal;
  description: string;
  iconUrl: string;
  lastUpdatedAt: number;
  licenseSkus: string[];
  name: string;
  type: string;
  uuid: string;
  userParams: Parameters;
  domainVisibility: DomainVisibility;

  constructor(obj?: Partial<AuthorConnector>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export enum GroupType {
  EVENT = 'Event',
  ACTION = 'Action',
  DATASOURCE = 'DataSource'
}

export class AuthorTriggerDef {
  description: string;
  domainVisibility: DomainVisibility;
  iconUrl: string;
  isLatest: boolean;
  name: string;
  originalTriggerDefUuid: string;
  registerConfig: RegisterConfig;
  registerRequest: Request;
  triggerRequestBody: Properties;
  unregisterRequest: Request;
  uuid: string;
  version: number;

  // support UI
  sharedInputParameters: SharedParameter;

  // to view in table
  groupType: GroupType;

  constructor(obj?: Partial<AuthorTriggerDef>) {
    if (obj) {
      obj.groupType = GroupType.EVENT;
      Object.assign(this, obj);
    }
  }
}

export interface DomainVisibility {
  accessibleUsers: string[];
  visibility: 'PUBLIC' | 'RESTRICTED';
  visibilityInherit?: boolean;
  published?: boolean;
}

export class AuthorActionDef {
  description: string;
  domainVisibility: DomainVisibility;
  iconUrl: string;
  isLatest: boolean;
  name: string;
  originalActionUuid: string;
  request: Request;
  response: Properties;
  tags: string[];
  type: string;
  uuid: string;
  version: number;

  // for connector subroutine
  subroutineUuid: string;
  subroutineVersion: number;

  // to view in table
  groupType: GroupType;

  constructor(obj?: Partial<AuthorActionDef>) {
    if (obj) {
      obj.groupType = GroupType.ACTION;
      Object.assign(this, obj);
    }
  }
}

export class AuthorDataSource {
  config: ConfigStaticDataSource[] | ConfigApiDataSource;
  description: string;
  name: string;
  type: 'STATIC' | 'API';
  uuid: string;

  // to view in table
  groupType: GroupType;

  constructor(obj?: Partial<AuthorDataSource>) {
    if (obj) {
      obj.groupType = GroupType.DATASOURCE;
      Object.assign(this, obj);
    }
  }

  get valueDataType(): string {
    switch (this.type) {
      case 'STATIC': {
        const configStatic = this.config as ConfigStaticDataSource[];
        return configStatic[0].valueDataType;
      }
      case 'API': {
        const configApi = this.config as ConfigApiDataSource;
        return configApi.response.valueDataType;
      }
    }
  }
}

export interface SharedParameter {
  url: BodyParameter[];
  headers: BodyParameter[];
  body: BodyParameter[];
}

export interface ContentRequest {
  template: string;
  parameters: BodyParameter[];
}

export interface Request {
  httpVerb: string;
  executionMode: string;
  postbackTimeout: number;
  maxRetry: number;
  url: ContentRequest;
  headers: ContentRequest;
  body: ContentRequest;
  parameters: BodyParameter[];
}

export interface Properties {
  properties: Output[];
}

export interface RegisterConfig {
  multipleRegistrationAllowed: boolean;
  reRegisterAllowed: boolean;
}

export interface CreateAuthorTriggerDef {
  name: string;
  description: string;
  sharedInputParameters: SharedParameter;
  registerRequest: Request;
  unregisterRequest: Request;
  triggerRequestBody: Properties;
  registerConfig: RegisterConfig;
  domainVisibility: DomainVisibility;
}

export interface CreateAuthorActionDef {
  name: string;
  description: string;
  type: string;
  request: Request;
  response: Properties;
  domainVisibility: DomainVisibility;
}

export interface UpdateDefGeneral {
  iconUrl: string;
  name: string;
  description: string;
  domainVisibility: DomainVisibility;
}

export interface ResponseConfigApiDataSource {
  valuePath: string;
  valueDataType: string;
  labelPath: string;
  targetArrayPath: string;
}

export interface ConfigApiDataSource {
  request: Request;
  response: ResponseConfigApiDataSource;
}

export interface CreateAuthorDataSource {
  name: string;
  description: string;
  type: string;
  config: ConfigStaticDataSource[] | ConfigApiDataSource;
}

export interface VerifyChangedData {
  urlChanges: UrlChange[];
  outputChanges: OutputChanges[];
  headersChanges: [];
  bodyChanges: [];
}

export interface UrlChange {
  key: string;
  title: string;
  reason: string;
}

export interface OutputChanges {
  path: string;
  title: string;
  reason: string;
}

export interface TriggerDefLinks {
  linked: boolean;
  name: string;
  originalUuid: string;
}

export interface TriggerLinkRes {
  connectorName: string;
  connectorUuid: string;
  triggerDefs: TriggerDefLinks[];
}
