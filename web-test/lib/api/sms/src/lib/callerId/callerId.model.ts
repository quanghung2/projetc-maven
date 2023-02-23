export interface UpdateGlobalBlacklistReq {
  action: 'add' | 'remove';
  keywords: string[];
}
