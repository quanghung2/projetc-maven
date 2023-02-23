export interface ContactUI {
  uuid: string; // id entity,

  livechat?: ChannelState;
  whatsapp?: ChannelState;
  selectTab: TabTxn;

  // state view
  viewingOlderMessage: boolean;
  lastSeenMsgID: string;
  viewDate: number;
}

export enum TabTxn {
  whatsapp = 'whatsapp',
  livechat = 'livechat',
  call = 'call'
}

export interface ChannelState {
  loaded?: boolean;
  page?: number;
  perPage?: number;
  hasMore?: boolean;
}
