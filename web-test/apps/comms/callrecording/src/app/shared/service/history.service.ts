import { forwardRef, Inject, Injectable } from '@angular/core';
import { History } from '../model/history.model';
import { BackendService } from './backend.service';
const HISTORY_PATH = '/private/v2/records';
declare var X: any;

@Injectable()
export class HistoryService {
  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService
  ) {}

  getHistories(query?: Object, force: boolean = false): Promise<any> {
    return this.backendService
      .get(HISTORY_PATH, query)
      .then((data: any) => {
        data.data = History.fromList(data.data);
        return data;
      })
      .catch((error: any) => {
        console.log(error);
        X.showWarn(error.message);
        return [];
      });
  }

  searchHistories(query?: Object, force: boolean = false): Promise<any> {
    return this.backendService
      .get(HISTORY_PATH + '/search', query)
      .then((data: any) => {
        data.data = History.fromList(data.data);
        return data;
      })
      .catch((error: any) => {
        console.log(error);
        X.showWarn(error.message);
        return [];
      });
  }

  getCsv(query?: Object) {
    return this.backendService.get(HISTORY_PATH + '/csv', query);
  }

  exportCSV(query?: Object) {
    return this.backendService.get(HISTORY_PATH + '/csvV2', query);
  }

  update(txnUuid: string, params: any) {
    return this.backendService.put(HISTORY_PATH + '/' + txnUuid, params);
  }

  archive(txnUuid: string) {
    return this.backendService.delete(HISTORY_PATH + '/' + txnUuid);
  }

  getBackupConfig() {
    return this.backendService.get(HISTORY_PATH + '/backup/config');
  }

  updateBackupConfig(enable: boolean) {
    return this.backendService.put(HISTORY_PATH + '/backup/config', {
      enable: enable
    });
  }

  fetchDownloadLinks(from: number, to: number) {
    return this.backendService.get(HISTORY_PATH + '/download/bulk', {
      from: from,
      to: to
    });
  }

  fetchBackupFiles(from: number, to: number) {
    return this.backendService.get(HISTORY_PATH + '/download/bulk/v2', {
      from: from,
      to: to
    });
  }

  deleteBulk(from: number, to: number) {
    return this.backendService.delete(HISTORY_PATH + '/delete/bulk?from=' + from + '&to=' + to);
  }

  fetchDownloadLink(txnUuid: string, fileType: string) {
    return this.backendService.get(HISTORY_PATH + '/' + txnUuid + '/download/' + fileType);
  }
}
