import { ActionDef } from '../../action-def/action-def.model';
import { ActionType, ExpressionTree, Mapping, Output } from '../../common.model';
import { FlowActionReq, PropertyForVariable, VariableForAction } from '../flow.model';

export type TypeAction =
  | ActionApi
  | ActionExternal
  | ActionDefineConstant
  | ActionLooping
  | ActionSharedVariable
  | ActionSubroutineCall
  | ActionSubroutineReturn
  | ActionSwitching
  | ActionTransform;

export interface UpdateActionReq {
  params: FlowActionReq;
  body: TypeAction;
  actionUuid: string;
}

export interface DeleteActionReq {
  flowUuid: string;
  version: number;
  actionUuid: string;
  body?: DependencyUpdateRequest;
}

export interface GetActionReq {
  flowUuid: string;
  version: number;
  actionUuid: string; // 1 action
  uuids: string[]; // actions by UUIDs
  pathId: string; // actions by path
}

export interface ActionDefLite {
  actionDefName: string;
  actionDefUuid: string;
  connectorUuid: string;
  iconUrl: string;
}

export interface Path {
  actionName: string;
  actionUuid: string;
  number: number;
  pathId: string;
  pathName: string;
}

export interface Action {
  actionDef: ActionDefLite;
  actionName: string;
  actionUuid: string;
  branchingPaths: Path[];
  flowUuid: string;
  number: number;
  type: ActionType;
  prevActionUuid: string;
  fullPath: string; // for resolve deprecated
  isResolvedDeprecate?: boolean; // for resolve deprecated
  isResolvedIncomplete?: boolean; // for resolve incomplete
}

export interface OutputFilter {
  isEnabled: boolean;
  selectivePaths: string[];
}

// Action type API
export interface MappingExtended {
  key: string;
  keyUsingExpressionTree: ExpressionTree;
  dataType: string;
  expressionTree: ExpressionTree;
}

export interface ActionApiConfig {
  urlMappings: Mapping[];
  headersMappings: Mapping[];
  bodyMappings: Mapping[];
  extendedMappings: MappingExtended[];
}

export class ActionApi {
  uuid: string;
  name: string;
  type: string;
  actionDefUuid: string;
  actionDef: ActionDefLite; // To view block action
  prevActionUuid: string;
  prevActionPathId: string;
  configs: ActionApiConfig;
  outputFilter: OutputFilter;
  dependencyUpdateRequest?: DependencyUpdateRequest;
}

// Action type SUBROUTINE_CALL
export interface ActionSubroutineConfig {
  mappings: Mapping[];
}
export class ActionSubroutineCall {
  uuid: string;
  name: string;
  type: string;
  actionDef: ActionDefLite; // To view block action
  actionDefUuid: string;
  prevActionUuid: string;
  prevActionPathId: string;
  configs: ActionSubroutineConfig;
  outputFilter: OutputFilter;
  dependencyUpdateRequest?: DependencyUpdateRequest;
}

// Action type SUBROUTINE_RETURN
export class ActionSubroutineReturn {
  uuid: string;
  name: string;
  type: string;
  prevActionUuid: string;
  configs: ActionSubroutineConfig;
  dependencyUpdateRequest?: DependencyUpdateRequest;
}

// Action type SWITCHING
export interface ActionSwitching {
  uuid?: string;
  name: string;
  type: string;
  prevActionUuid: string;
  prevActionPathId: string;
  configs: ActionSwitchingConfig;
  outputFilter: OutputFilter;
  targetDescendantPathId?: string;
  dependencyUpdateRequest?: DependencyUpdateRequest;
}

export interface ActionSwitchingConfig {
  options: OptionSwitching[];
  expressionMappings: ExpressionMappings;
}

export interface OptionSwitching {
  value: string;
  valueTree: ExpressionTree;
  title: string;
  type: string;
  pathId?: string;
  dataType?: string;
  isDefault?: boolean;
}

export interface OptionActionSwitching {
  pathId: string;
  pathName: string;
  title: string;
  value: string[];
  isDefault: boolean;
  actionUuid?: string;
}

export interface ExpressionMappings {
  [key: string]: [ExpressionTree[]];
}

// Action type TRANSFORM
export interface ActionTransform {
  uuid?: string;
  name: string;
  type: string;
  prevActionUuid: string;
  prevActionPathId: string;
  configs: ActionTransformConfig;
  targetDescendantPathId?: string;
  dependencyUpdateRequest?: DependencyUpdateRequest;
}
export interface ActionTransformConfig {
  transformFunction: ExpressionTree;
}

// Action type DEFINE_CONSTANTS
export interface ActionDefineConstant {
  uuid?: string;
  name: string;
  type: string;
  prevActionUuid: string;
  prevActionPathId: string;
  configs: ActionDefineConstantConfig;
  targetDescendantPathId?: string;
  dependencyUpdateRequest?: DependencyUpdateRequest;
}

export interface DefineConstant {
  title: string;
  description: string;
  dataType: 'string' | 'number' | 'boolean';
  value: ExpressionTree;
}

export interface ActionDefineConstantConfig {
  constants: DefineConstant[];
}

// Action type EXTERNAL
export interface ActionExternal {
  uuid?: string;
  name: string;
  type: string;
  prevActionUuid: string;
  prevActionPathId: string;
  configs: ActionExternalConfig;
  outputFilter: OutputFilter;
  targetDescendantPathId?: string;
  dependencyUpdateRequest?: DependencyUpdateRequest;
}

export interface ActionExternalConfig {
  httpVerb: string;
  maxRetry: number;
  urlTemplate: string;
  urlMappings: Mapping[];
  headerTemplate: string;
  headersMappings: Mapping[];
  bodyTemplate: string;
  bodyMappings: Mapping[];
  extractedResponseFields: Output[];
}

// Action type SET/GET/PUSH/POP_SHARED_VARIABLE
export interface ActionSharedVariable {
  uuid?: string;
  name: string;
  type: string;
  prevActionUuid: string;
  prevActionPathId: string;
  configs: ActionSharedVariableConfig;
  outputFilter: OutputFilter;
  targetDescendantPathId?: string;
  dependencyUpdateRequest?: DependencyUpdateRequest;
}

export interface ActionSharedVariableConfig {
  // For all type (set/get/push/pop/increment)
  flowUuid: string;
  dynVariableName: string;

  // For only set/push/increment
  ttl: number;
  ttlUnit: 'DAYS' | 'HOURS' | 'MINUTES';

  // For only set/push
  value: ExpressionTree;

  // For only push/pop
  mode: string;

  // For only pop
  index: number;
}

// Action type LOOPING_ACTION
export interface ActionLooping {
  uuid?: string;
  name: string;
  type: string;
  actionDef: ActionDefLite;
  prevActionUuid: string;
  prevActionPathId: string;
  configs: ActionLoopingConfig;
  outputFilter: OutputFilter;
  targetDescendantPathId?: string;
  dependencyUpdateRequest?: DependencyUpdateRequest;
}

export interface ActionLoopingConfig {
  maxAllowedIteration: number;
  arrayExpression: ExpressionTree;
  subroutineMappings: Mapping[];
}

// Replace
export interface ReplaceActionReq {
  params: FlowActionReq;
  body: TypeAction;
  actionUuid: string;
  actionDef?: ActionDef;
}

export interface Dependency {
  name: string;
  configs: ActionApiConfig;
}

export interface DependencyUpdateRequest {
  pathId2Keep?: string;
  dependants?: {
    [key: string]: Dependency;
  };
}

export interface DependencyAction {
  uuid: string;
  name: string;
  type: string;
  actionDef: ActionDefLite; // To view block action
  prevActionUuid: string;
  configs:
    | ActionApiConfig
    | ActionSubroutineConfig
    | ActionSwitchingConfig
    | ActionTransformConfig
    | ActionExternalConfig
    | ActionSharedVariableConfig;
  usedResponseExpressionTrees: ExpressionTree[];
  contextVariables: VariableForAction[];
}

export interface ReplaceRes {
  dependencies: DependencyAction[];
  newActionOutputProperties: PropertyForVariable[];
  newTriggerOutputProperties: PropertyForVariable[];
  newActionUuid: string;
}
