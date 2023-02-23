import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { CaseMetaData } from './cases-metadata.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'support-center_metadata' })
export class CaseMetaDataStore extends Store<CaseMetaData> {
  constructor() {
    super({});
  }
}
