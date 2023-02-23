import { BaseModel } from './base.model';
import { AppType } from './subscription.model';

export enum HistoryStatus {
  ACTIVE = <any>'ACTIVE',
  ARCHIVED = <any>'ARCHIVED',
  BACKED_UP = <any>'BACKED_UP'
}
export class History extends BaseModel {
  public txnUuid: string = null;
  public orgUuid: string = null;
  public status: HistoryStatus | string = null;
  public app: AppType = null;
  public callFrom: string = null;
  public callTo: string = null;
  public startedAt: Date = null;
  public finishedAt: Date = null;
  public extra: any = null;

  // extra options
  public appLogo: string = null;
  public monitorUrl: string = null;
  public hashUrl: string = null;
  public note: string = null;
  public tag: string = null;

  public subscription: string;

  getExtra() {
    if (this.extra == undefined) {
      return {};
    }
    return JSON.parse(this.extra);
  }

  static fromList(sources: Array<History>) {
    return sources.map(s => new History().update(s));
  }
}
