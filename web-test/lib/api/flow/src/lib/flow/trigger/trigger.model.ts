import { Mapping, Output } from '../../common.model';
import { Dependency, DependencyAction } from '../actions/actions.model';
import { PropertyForVariable } from '../flow.model';

export interface TriggerOutput {
  extended: Output[];
  parent: Output[];
}

export interface TriggerDefLite {
  connectorUuid: string;
  iconUrl: string;
  triggerDefName: string;
  triggerDefUuid: string;
}

export interface TriggerConfig {
  urlMappings: Mapping[];
  headersMappings: Mapping[];
  bodyMappings: Mapping[];
}

export interface TriggerReq {
  defUuid: string;
  configs: TriggerConfig;
  extensionConfig: ExtensionConfig;
  dependantsUpdateRequest: {
    [key: string]: Dependency;
  };
}

export interface ExtensionConfig {
  extendable: boolean;
  path: string;
  mode: 'BASIC' | 'ADVANCED';
  extendedOutputs: ExtendOutput[];
}

export interface ExtendOutput {
  field: string;
  dataType: string;
  arrayItemDataType: string;
  arrayItemProps: ExtendOutput[] | Output[];
}

export interface ExtendTriggerRes {
  status: string;
  trigger: Trigger;
  dependencies: DependencyAction[];
  newTriggerOutputProperties: PropertyForVariable[];
}

export interface Trigger {
  configs: TriggerConfig;
  def: TriggerDefLite;
  extensionConfig: ExtensionConfig;
  outputAutoInjectionTokens: string[];
  outputs: TriggerOutput;
}
