import { ActionType, BodyParameter, Output } from '../common.model';
import { Connector } from '../connector/connector.model';

export interface ActionDef {
  bodyParameters: BodyParameter[];
  description: string;
  extendablePath: string;
  headersParameters: BodyParameter[];
  iconUrl: string;
  inputAutoInjectionTokens: string[];
  name: string;
  outputs?: Output[];
  parameters: BodyParameter[];
  presentName: string;
  subroutineUuid: string;
  subroutineVersion: number;
  tags: string[];
  type: ActionType;
  urlParameters: BodyParameter[];
  uuid: string;
  originalUuid: string;
  version?: number;
  businessActionUuid: string;
  businessActionRelatedConnectors: Connector[];
  hasParameter: boolean; // support UI
}

export interface GetBusinessActionDefReq {
  triggerDefUuid: string;
  additionalKey: string;
  excludeInUse: boolean;
  releaseGroupId: string;
}
