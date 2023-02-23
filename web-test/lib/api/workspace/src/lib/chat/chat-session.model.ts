export class ChatSession {
  chatUser: string; // user
  chatUserUuid: string; // customer
  id: string;
  ns: string;
  token: string;
  addr: string;

  constructor(obj?: Partial<ChatSession>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get chatNode() {
    return this.addr.replace(/\..*$/, '');
  }
}

export enum ChatTopic {
  TEAM = 'TEAM',
  SUPPORT = 'SUPPORT',
  LIVECHAT = 'LIVECHAT',
  SC = 'SC'
}
