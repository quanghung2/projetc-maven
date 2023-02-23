import { ExpressionTree, Output, Parameters, RenderDirective } from '../common.model';

export interface CreateNewBaCreatorReq {
  flowUuid: string;
  flowVersion: number;
  input: Parameters;
}

export interface MappedEventTriggerDef {
  uuid: string;
  name: string;
  version: number;
  isLatest: boolean;
  outputs: Output[];
}

export interface MappedEventMapping {
  actionDefInputKey: string;
  dataType: string;
  defaultValue: ExpressionTree;
  userInputAllowed: boolean;
}

export interface MappedEvent {
  id: number;
  latestTriggerDef: MappedEventTriggerDef;
  latestUpdatedAt: number;
  latestVersion: number;
  mappings: MappedEventMapping[];
  releaseGroupId: string;
  status: 'NORMAL' | 'NEED_UPGRADE';
  triggerDef: MappedEventTriggerDef;
}

export interface BaInputParams {
  dataType: string;
  description: string;
  hidden: boolean;
  isOptional: boolean;
  key: string;
  renderDirective: RenderDirective;
  title: string;
}

export interface ReleaseGroup {
  id: string;
  name: string;
}

export interface SetMappedEventReq {
  baFlowUuid: string;
  baFlowVersion: number;
  triggerDefUuid: string;
  mappings: MappedEventMapping[];
  releaseGroupId: string;
}

export interface BaCreatorActionDef {
  uuid: string;
  name: string;
}

export interface BaCreatorMutex {
  id: number;
  group: string[];
  lastUpdatedAt: string;
  actions: BaCreatorActionDef[]; // for view
}
