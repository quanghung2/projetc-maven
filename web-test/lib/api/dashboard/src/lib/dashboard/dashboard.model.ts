import { KeyValue } from '@angular/common';
import { TimeRangeKey } from '@b3networks/shared/common';
import { QuestionRequest } from '../question/question.model';

export enum DashboardType {
  wallboard = 'wallboard',
  virtual_line = 'virtual_line'
}

export enum FilterType {
  selection = 'selection'
}

export enum FilterDataType {
  byQueue = 'byQueue'
}

export interface FilterData {
  startTime?: string;
  endTime?: string;
  timeRangeKey: TimeRangeKey;
  addon?: { [TKey in FilterDataType]: any };
}

export class DashboardFilter {
  id: string;
  request: QuestionRequest;
  label: string;
  type: FilterType;
  multi: boolean;
  selectedValue: any;
  mapping: KeyValue<string, string>;
  dataType: FilterDataType;
}

export class DashboardConfig {
  filters: DashboardFilter[] = [];

  static hardCodeForWallboard() {
    return Object.assign(new DashboardConfig(), {
      filters: [
        {
          id: 'filterByQueue',
          request: {
            path: 'callcenter/private/v1/config/queues',
            method: 'get',
            params: {}
          },
          label: 'Filter by queue',
          type: 'selection',
          multi: true,
          mapping: {
            key: 'uuid',
            value: 'label'
          },
          dataType: FilterDataType.byQueue
        }
      ]
    });
  }
}

export class Dashboard {
  uuid: string;
  name: string;
  config: DashboardConfig;
  createdAt: Date;
  updatedAt: Date;
  service: DashboardType;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
    if (this.service === DashboardType.wallboard && !this.config) {
      this.config = DashboardConfig.hardCodeForWallboard();
    }
  }

  get formatedServiceName() {
    return !!this.service ? this.service.replace('_', ' ') : this.service;
  }

  clone() {
    return new Dashboard(this);
  }
}
