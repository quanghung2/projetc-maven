import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Action } from './actions/actions.model';
import { Flow } from './flow.model';
import { UsableInjectionTokensList } from './simple-app/simple-app.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_flow', resettable: true })
export class FlowStore extends Store<Flow> {
  constructor() {
    super(
      new Flow({
        ui: {
          breadcrumb: [],
          actions: [],
          totalActions: 0,
          usableInjectionTokensList: [],
          actionSelected: null,
          nodeTrees: [],
          treeNodeSelected: null,
          viewLogVersion: null
        }
      })
    );
  }

  updateUI(key: string, value: any) {
    this.update(flow => ({
      ui: {
        ...flow.ui,
        [key]: value
      }
    }));
  }

  updateUIAction(actions: Action[], totalActions: number, usableInjectionTokensList?: UsableInjectionTokensList[]) {
    this.update(flow => ({
      ui: {
        ...flow.ui,
        actions,
        totalActions,
        usableInjectionTokensList
      }
    }));
  }
}
