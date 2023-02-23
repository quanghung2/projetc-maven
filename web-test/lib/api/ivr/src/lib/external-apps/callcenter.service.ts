import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { CallcenterQueue } from './callcenter-queue';

@Injectable({ providedIn: 'root' })
export class CallcenterService {
  private callCenterQueues: CallcenterQueue[];

  constructor(protected http: HttpClient) {}

  public getCallCenterQueue(): Observable<CallcenterQueue[]> {
    if (this.callCenterQueues) {
      return of(this.callCenterQueues);
    }

    return this.http.get<CallcenterQueueResp>(`workflow/private/v1/callcenter`).pipe(
      map(res => {
        this.callCenterQueues = new CallcenterQueueResp(res).queues;
        return this.callCenterQueues;
      })
    );
  }

  public getQueueMap() {
    if (!this.callCenterQueues) {
      return {};
    }
    return _.keyBy(this.callCenterQueues, (item: CallcenterQueue) => {
      return item.uuid;
    });
  }
}

export class CallcenterQueueResp {
  queues: CallcenterQueue[] = [];

  constructor(obj?: any) {
    Object.assign(this, obj);
    this.queues = this.queues.map(queue => new CallcenterQueue(queue));
  }
}
