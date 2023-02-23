import { TimeRangeKey } from '@b3networks/shared/common';

export interface GetLogsReq {
  nextCursor: number;
  size: number;
  timeRange: TimeRangeKey;
  startTime: number;
  endTime: number;
  version: number;
  sortDirection: 'desc' | 'asc';
  keyword: string;

  //for devhub log
  flowUuid: string;
  status: string;
}

export interface GetLogsRes {
  data: ExecutionLog[];
  nextCursor: number;
}

export interface GroupByLog {
  groupName: string;
  isGroupBy: boolean;
  type: 'RUNNING' | 'DONE';
  isNextCursor: boolean;
}

export class StoreLogs {
  filterLogs: GetLogsReq;
  dataLogs: (ExecutionLog | GroupByLog)[];
  nextCursorRunning: number;
  nextCursorDone: number;

  filterAdvancedLogs: GetLogsReq;
  dataAdvancedLogs: ExecutionLog[];

  constructor(obj?: Partial<StoreLogs>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface ViewDetailReq {
  flowUuid: string;
  flowName: string;
  version: number;
  id: number;
  tab: string;
}

export interface ParamsLog {
  title: string;
  value: string;
}

export interface ActionLog {
  actionName: string;
  state: string;
  startTime: number;
  endTime: number;
  errorMsg: string;
  inputParams: ParamsLog[];
  outputParams: ParamsLog[];
  subroutineExecutionId: number;
  subroutineUuid: string;
  subroutineVersion: number;
  nestedExecutionInfo: MainFlowInfo;
  nestedIterations: ActionLog[];
}

export interface MainFlowInfo {
  flowUuid: string;
  flowVersion: number;
  executionId: number;
}

export interface ExecutionLog {
  actions: ActionLog[];
  endTime: number;
  flowUuid: string;
  flowName: string;
  id: number;
  mainFlowInfo: MainFlowInfo;
  orgUuid: string;
  startTime: number;
  status: 'running' | 'success' | 'failed';
  triggerData: ParamsLog[];
  triggerName: string;
  version: number;
  type: string | 'RUNNING' | 'DONE'; // support UI
}
