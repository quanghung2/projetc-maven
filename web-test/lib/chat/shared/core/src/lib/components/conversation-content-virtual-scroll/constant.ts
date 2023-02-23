import { ChatMessage, SystemType } from '@b3networks/api/workspace';
import { format } from 'date-fns';
import { IDatasource } from 'ngx-ui-scroll';

export const DEFAULT_LIMIT = 50;
export const DATA_SOURCE_BUFFER_SIZE = 50;
export const DATA_INIT = 10;
export const DATA_INIT_V2 = 0;
export const DATA_SOURCE_START_INDEX = 0;
export const HANDLE_SYSTEMS = [SystemType.EDIT, SystemType.DELETE];
export const HANDLE_SYSTEMS_V2 = [SystemType.EDIT, SystemType.DELETE, SystemType.PURGE];

export type Settings = IDatasource['settings'];
export type DevSettings = IDatasource['devSettings'];

export const SCROLL_DEV_SETTINGS = <DevSettings>{
  debug: false,
  immediateLog: false,
  logProcessRun: false,
  logTime: false,
  changeOverflow: false,
  dismissOverflowAnchor: false
};

export interface ItemAdapter {
  $index: number;
  data: InfoMessage;
  element?: HTMLElement;
}

export class InfoMessage {
  current: ChatMessage;
  pre: ChatMessage;
  isFake: boolean; // get datasource at least 1 data to continue virtual scroll
  isDiffDate: boolean;

  constructor(current: ChatMessage, pre: ChatMessage, isFake = false) {
    this.current = current;
    this.pre = pre;
    this.isFake = isFake;
    if (this.pre) {
      this.isDiffDate =
        format(new Date(this.current?.ts), 'dd/MM/yyyy') !== format(new Date(this.pre?.ts), 'dd/MM/yyyy');
    }
  }

  set preMessage(pre: ChatMessage) {
    this.isDiffDate = format(new Date(this.current?.ts), 'dd/MM/yyyy') !== format(new Date(pre?.ts), 'dd/MM/yyyy');
    this.pre = pre;
  }
}

export interface QueryDataScroll {
  query: InfoMessage[];
  postion: PositionScroll;
  // 0 = init, -1 no has more , 1 has more
  hasMoreTop: number;
  hasMoreBottom: number;

  index?: number;
  count?: number;
}

export enum PositionScroll {
  none = 'none',
  top = 'top',
  bottom = 'bottom'
}
