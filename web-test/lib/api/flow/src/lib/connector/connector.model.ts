import { ActionDef } from '../action-def/action-def.model';
import { AuthenticationType, BodyParameter, Mapping } from '../common.model';

export interface AuthConfig {
  value: string;
  token: string;
}

export interface Mappings {
  mappings: Mapping[];
}

export interface ConnectorReq {
  flowUuid?: string;
  flowVersion?: number;
}

export interface SetConfigReq {
  userMappings: Mappings;
  authenticationInfo: AuthConfig;
  flowUuid: string;
  flowVersion: number;
}

export class Connector {
  authenticationInfo: AuthConfig;
  authenticationType: AuthenticationType;
  backgroundColor: string;
  description: string;
  iconUrl: string;
  name: string;
  needToSetAuthInfo: boolean;
  type: string;
  uuid: string;
  userMappings: Mappings;
  userParams: BodyParameter[];
  actionDefs: ActionDef[];

  constructor(obj?: Partial<Connector>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get needToSetParam(): boolean {
    for (let i = 0; i < this.userParams?.length; i++) {
      const x = this.userMappings?.mappings?.find(m => m.key == this.userParams[i].key);
      if (!x) {
        return true;
      }
    }
    return false;
  }

  get mustToSetAuthInfo(): boolean {
    return this.authenticationType && this.authenticationType !== AuthenticationType.NO_AUTH;
  }

  get mustToSetParam(): boolean {
    return this.userParams.length > 0;
  }
}

export interface ConnectorSuggestionReq {
  flowUuid: string;
  version: number;
  connectorUuid: string;
}
