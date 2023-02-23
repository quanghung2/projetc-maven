import { ConfigStaticDataSource } from '../common.model';

export interface GetDataSourceReq {
  flowUuid: string;
  flowVersion: number;
  dataSourceUuid: string;
}

export interface ConnectorLite {
  uuid: string;
  name: string;
  iconUrl: string;
}

export class DataSourceForSubroutine {
  connector: ConnectorLite;
  description: string;
  name: string;
  staticValues: ConfigStaticDataSource[];
  type: 'STATIC' | 'API';
  uuid: string;
  valueDataType: string;

  constructor(obj?: Partial<DataSourceForSubroutine>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get displayText() {
    return `${this.connector.name} - ${this.name}`;
  }
}
