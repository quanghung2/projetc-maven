import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export class InvalidConnector {
  invalidConnectors: string[];

  constructor(obj?: Partial<InvalidConnector>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_prerequisite' })
export class PrerequisiteStore extends Store<InvalidConnector> {
  constructor() {
    super(new InvalidConnector({}));
  }
}
