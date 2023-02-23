import { forwardRef, Inject, Injectable } from '@angular/core';
import { BackendService } from './backend.service';

const HISTORY_V2_PATH = '/private/v2/records';
const HISTORY_V3_PATH = '/private/v3/records';

declare var X: any;

@Injectable()
export class NewHistoryService {
  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService
  ) {}

  getHistories(queryRequest?: QueryRequest) {
    return this.backendService.get(HISTORY_V3_PATH, queryRequest);
  }

  getDownloadURL(txnUuid: string, fileType: string): Promise<any> {
    return this.backendService.get(HISTORY_V2_PATH + '/' + txnUuid + '/download/' + fileType);
  }

  getSftpURL(txnUuid: string, monitorS3: any): Promise<any> {
    return this.backendService.post(`${HISTORY_V3_PATH}/sftp/url`, monitorS3);
  }
}

export class QueryRequest {
  constructor(
    public app?: string,
    public fromNumber?: string,
    public toNumber?: string,
    public fromTime?: number,
    public toTime?: number,
    public timezone?: string,
    public page: number = 1
  ) {}
}
