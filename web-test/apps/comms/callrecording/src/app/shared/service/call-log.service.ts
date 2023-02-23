import { forwardRef, Inject, Injectable } from '@angular/core';
import { BackendService } from './backend.service';

declare let X: any;

const CALL_LOG_PATH = '/private/v2/accessrule';

@Injectable()
export class CallLogService {
  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService
  ) {}

  getCallLog(query?: Object): Promise<any> {
    return this.backendService
      .get(CALL_LOG_PATH + '/new', query)
      .then((data: any) => {
        return Object.assign([], data);
      })
      .catch((error: any) => {
        console.log(error);
        X.showWarn(error.message);
        return [];
      });
  }

  getCallerId(): Promise<any> {
    return this.backendService
      .get(CALL_LOG_PATH + '/callerId')
      .then((data: any) => {
        return Object.assign([], data);
      })
      .catch((error: any) => {
        console.log(error);
        X.showWarn(error.message);
        return [];
      });
  }
}
