import { ActionDef } from '../action-def/action-def.model';
import { ActionType, ExpressionTree, Parameters } from '../common.model';
import { Connector } from '../connector/connector.model';
import { FunctionVariable } from '../function/function.model';
import { TriggerDef } from '../trigger-def/trigger-def.model';
import { Action, ActionDefLite, DependencyAction, ReplaceActionReq } from './actions/actions.model';
import { UsableInjectionTokensList } from './simple-app/simple-app.model';
import { TriggerDefLite, TriggerReq } from './trigger/trigger.model';

export interface CreateFlowReq {
  name: string;
  description: string;
  type: string;
  projectUuid: string;
}

export interface CreateSubroutineReq {
  flowUuid: string;
  flowVersion: number;
  input: Parameters;
  output: Parameters;
  autoInjectOngoingCallTxn: boolean;
}

export interface UpdateFlowReq {
  name: string;
  description: string;

  // For subroutine
  subroutineInput: Parameters;
  subroutineOutput: Parameters;
  autoInjectOngoingCallTxn: boolean;

  // For business action
  businessActionInput: Parameters;
}

export interface FlowUI {
  // Breadcrumb
  breadcrumb: Breadcrumb[];

  // Action
  actions: Action[];
  totalActions: number;
  usableInjectionTokensList: UsableInjectionTokensList[]; // For add action programmable flow
  actionSelected: Action; // For action suggestion (left sidebar)

  // Tree
  nodeTrees: TreeNode[];
  treeNodeSelected: TreeNode;

  // Viewlog
  viewLogVersion: number;
}

export class Flow {
  activeVersion: number;
  description: string;
  draftName: string;
  draftVersion: number;
  isActive: boolean;
  isArchived: boolean;
  lastUpdatedAt: number;
  name: string;
  totalWarnings: number;
  type: 'NORMAL' | 'SUBROUTINE' | 'BUSINESS_ACTION';
  uuid: string;
  version: number;

  // For type subroutine
  subroutineInput: Parameters;
  subroutineOutput: Parameters;
  autoInjectOngoingCallTxn: boolean;

  // For type business action
  businessActionInput: Parameters;
  presentName: string;

  // For Campaign Cpaas
  subUuid?: string;

  // For UI
  ui: FlowUI;

  constructor(obj?: Partial<Flow>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get editable(): boolean {
    return !this.isArchived && !this.isActive;
  }
}

export class SimpleFlow {
  activeLastUpdatedAt: number;
  activeTotalWarnings: number;
  activeVersion: number;
  draftLastUpdatedAt: number;
  draftTotalWarnings: number;
  draftVersion: number;
  name: string;
  type: 'NORMAL' | 'SUBROUTINE' | 'BUSINESS_ACTION';
  uuid: string;

  // For BUSINESS_ACTION
  mappedTriggerNames: string[];
  presentName: string;

  constructor(obj?: Partial<SimpleFlow>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface FlowActionReq {
  flowUuid: string;
  version: number;
}

export interface SamePathActionsRes {
  actionsInTheSamePath: Action[];
  totalActions: number;
  usableInjectionTokensList: UsableInjectionTokensList[];
}

// Breadcrumb
export interface PathOfBreadcrumb {
  isCurrent: boolean;
  nextActionName: string;
  nextActionUuid: string;
  number: number;
  pathId: string;
  pathName: string;
}

export interface Breadcrumb {
  actionUuid: string;
  actionName: string;
  paths: PathOfBreadcrumb[];
  type: string;
}

// GetVariables
export interface GetVariablesReq {
  flowUuid: string;
  flowVersion: number;
  prevActionUuid?: string;
  currentActionUuid?: string;
}

export interface PropertyForVariable {
  arrayItemDataType: string;
  arrayItems: PropertyForVariable[];
  dataType: string;
  description: string;
  expressionTree: ExpressionTree;
  path: string;
  selectionDataSourceUuid: string;
  title: string;

  // To view
  actionNameAndTitle: string;
}

export class VariableForAction {
  index: number;
  actionName: string;
  actionUuid: string;
  number: number;
  properties: PropertyForVariable[];
  functionVariable?: FunctionVariable[];
  type?: string;

  constructor(obj?: Partial<VariableForAction>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface TreeNode {
  actionDef: ActionDefLite;
  actionType?: ActionType;
  children: TreeNode[];
  nodeType: 'ACTION' | 'NORMAL_TRIGGER' | 'SUBROUTINE_TRIGGER' | 'BUSINESS_ACTION_TRIGGER';
  name: string;
  number: number;
  triggerDef: TriggerDefLite;
  isTrigger: boolean;
  isSubroutineTrigger: boolean;
  isExpand?: boolean;
  isVisible: boolean;
  actionUuid: string;
  pathId?: string;
  subroutineUuid?: string;
  isShowEditDialog: boolean;
  showHighLightAction: boolean;
  isScrollGotoElement: boolean;
}

export enum CodeWarning {
  ACTION_DEF_DEPRECATION = 'ACTION_DEF_DEPRECATION',
  TRIGGER_DEF_DEPRECATION = 'TRIGGER_DEF_DEPRECATION',
  INCOMPLETE_ACTION = 'INCOMPLETE_ACTION',
  INCOMPLETE_TRIGGER = 'INCOMPLETE_TRIGGER'
}

export interface FlowWarning {
  code: CodeWarning;
  actionDef: ActionDef;
  triggerDef: TriggerDef;
  latestActionDef: ActionDef;
  latestTriggerDef: TriggerDef;
  relatedActionUuids?: string[];
  connector: Connector;
  actions: Action[];
}

export interface ResolveDependencyInput {
  dependencys: DependencyAction[];
  replace: boolean;

  isTrigger?: boolean;
  isExtendTrigger?: boolean;
  newTriggerName: string;
  replaceTriggerData: TriggerReq;
  extendTriggerData: TriggerReq;
  newTriggerOutputProperties: PropertyForVariable[];

  action: Action;
  pathId2Keep: string;
  replaceActionData: ReplaceActionReq;
  newActionOutputProperties: PropertyForVariable[];
  newActionUuid: string;
}

export interface ExportFlowReq {
  appOrigin: string;
  uuid: string;
  version: number;
}

export interface ExportFlowRes {
  checksum: string;
  exportedDate: string;
  data: string;
}

export interface ImportFlowReq {
  checksum: string;
  data: string;
  appOrigin: string;
  projectUuid?: string;
}
