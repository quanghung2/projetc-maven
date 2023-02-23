import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { TtsVendor2 } from './tts-vendor.model';

export interface TtsVendorState extends EntityState<TtsVendor2> {
  languages: string[];
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workflow_tts-vendor', idKey: 'code' })
export class TtsVendorStore extends EntityStore<TtsVendorState> {
  constructor() {
    super();
  }
}
