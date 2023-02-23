import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ConnectorState, ConnectorStore } from './connector.store';

@Injectable({ providedIn: 'root' })
export class ConnectorQuery extends QueryEntity<ConnectorState> {
  constructor(protected override store: ConnectorStore) {
    super(store);
  }

  selectActionDefs(connectorUuid: string) {
    return this.selectEntity(connectorUuid, 'actionDefs');
  }
}
