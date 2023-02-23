import { HashMap } from '@datorama/akita';
import { ActionDef } from '../action-def/action-def.model';
import { Mapping } from '../common.model';
import { AuthConfig, Mappings } from '../connector/connector.model';
import { TriggerConfig } from '../flow/trigger/trigger.model';
import { TriggerDef } from '../trigger-def/trigger-def.model';

export enum ActionBaUserState {
  NORMAL = 'NORMAL',
  NEW_BUSINESS_ACTION = 'NEW_BUSINESS_ACTION',
  NEW_BUSINESS_ACTION_AND_NEW_EVENT = 'NEW_BUSINESS_ACTION_AND_NEW_EVENT',
  NEW_EVENT = 'NEW_EVENT',
  DEPRECATED = 'DEPRECATED'
}

export interface TriggerBaUser {
  def: TriggerDef;
  latestDef: TriggerDef;
  configs: TriggerConfig;
}

export interface ActionConfig {
  mappings: Mapping[];
}

export interface ActionBaUser {
  name: string;
  actionDef: ActionDef;
  latestActionDef: ActionDef;
  state: ActionBaUserState;
  configs: ActionConfig;
  showLatestActionDef: boolean; // support UI
}

export interface BaUser {
  trigger: TriggerBaUser;
  actions: ActionBaUser[];
  additionalKey: string;
}

export interface ConnectorConfigBaUser {
  userMappings: Mappings;
  authenticationInfo: AuthConfig;
}

export interface TriggerBaUserReq {
  defUuid: string;
  config: TriggerConfig;
  connectorConfig: ConnectorConfigBaUser;
}

export interface ConnectorConfigMapBaUser {
  [key: string]: ConnectorConfigBaUser;
}

export interface ActionBaUserReq {
  defUuid: string;
  config: ActionConfig;
  connectorConfigMap: ConnectorConfigMapBaUser;
}

export interface SaveBaUserReq {
  trigger: TriggerBaUserReq;
  actions: ActionBaUserReq[];
  additionalKey: string;
  extraAuditInfo: {
    auditData: {
      fromApp: string;
      target: string;
    };
  };
}

export class InputBaUserReq {
  triggerDef: TriggerDef;
  defaultParam: HashMap<string>;
  hideDefaultParam: boolean;
  queueName?: string;

  constructor(obj?: Partial<InputBaUserReq>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get additionalKey() {
    let additionalKey = '';
    Object.keys(this.defaultParam).forEach(key => {
      const x = this.triggerDef.baUseKeyComponents.find(k => k == key);
      if (x) {
        additionalKey += this.defaultParam[key].toString().toLowerCase();
      }
    });
    return additionalKey;
  }
}
