import { Injectable } from '@angular/core';
import { LogService, SendLogReq } from '@b3networks/api/portal';
import { ChatService } from '@b3networks/api/workspace';
import { HashMap } from '@datorama/akita';
import { Subject } from 'rxjs';
import { debounceTime, retry, take } from 'rxjs/operators';

export interface LogInfo {
  status?: boolean;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogStrageryService {
  private _jobMap: HashMap<LogInfo> = {};
  private _countJobStarted = 0;
  private _isStarted: boolean;
  private _stream = new Subject<HashMap<LogInfo>>();

  constructor(private logService: LogService, private chatService: ChatService) {}

  startJob() {
    if (!this._isStarted) {
      this._isStarted = true;
      this._countJobStarted++;
      this._stream
        .asObservable()
        .pipe(debounceTime(30000), take(1))
        .subscribe(jobs => {
          this._isStarted = false;
          console.log('jobs: ', jobs);
          const failedJobs: HashMap<LogInfo> = {};
          Object.keys(jobs).forEach(key => {
            if (!jobs[key]?.status) {
              failedJobs[key] = jobs[key];
            }
          });

          if (Object.keys(failedJobs)?.length > 0) {
            this.logService
              .sendLog(<SendLogReq>{
                type: 'error',
                source: 'init_UW',
                data: {
                  chat: this.chatService.session,
                  jobs: failedJobs,
                  countJobStarted: this._countJobStarted
                }
              })
              .pipe(retry(3))
              .subscribe(_ => this.cleanUp());
          } else {
            this.cleanUp();
          }
        });
    }
  }

  cleanUp() {
    this._jobMap = {};
  }

  addJob(key: string) {
    if (!this._jobMap?.[key]) {
      this._jobMap[key] = {
        status: false
      };
    } else {
      key += '_' + new Date().getTime();
      this._jobMap[key] = {
        status: false
      };
    }
    this._stream.next(this._jobMap);

    return key;
  }

  updateJob(key: string, log: LogInfo) {
    if (this._jobMap?.[key]) {
      this._jobMap[key] = {
        ...this._jobMap[key],
        ...log
      };
      this._stream.next(this._jobMap);
    }
  }
}
