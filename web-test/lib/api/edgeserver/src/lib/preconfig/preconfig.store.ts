import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { PreConfig } from './preconfig.model';

export const RELAY_HEADERS = ['P-Asserted-Identity', 'Remote-Party-ID', 'Diversion', 'P-Preferred-Identity', 'Privacy'];

export function createInitialState(): PreConfig {
  return {
    nodename: '',
    directions: [],
    cluster: null,
    codecs: [],
    headers: RELAY_HEADERS,
    contexts: [],
    manipulation: [],
    limitation: null,
    pattern: null
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'edge_preconfig' })
export class PreConfigStore extends Store<PreConfig> {
  constructor() {
    super(createInitialState());
  }
}
