import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ActionDef } from '../action-def/action-def.model';
import { Connector } from './connector.model';

export interface ConnectorState extends EntityState<Connector> {
  ui: {
    actionDefSelected: ActionDef;
    connectorSelected: Connector;
    connectorsSuggestion: Connector[];
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_connector', idKey: 'uuid' })
export class ConnectorStore extends EntityStore<ConnectorState> {
  constructor() {
    super({ ui: null });
  }

  resetUI() {
    this.update(state => {
      return {
        ...state,
        ui: {
          ...state.ui,
          actionDefSelected: null,
          connectorSelected: null
        }
      };
    });
  }
}
