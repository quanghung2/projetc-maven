import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { TtsVendorState, TtsVendorStore } from './tts-vendor.store';

@Injectable({ providedIn: 'root' })
export class TtsVendorQuery extends QueryEntity<TtsVendorState> {
  languages$ = this.select(state => state.languages);

  constructor(protected override store: TtsVendorStore) {
    super(store);
  }

  selectAllByLanguage(language: string) {
    return this.selectAll({ filterBy: e => e.language === language });
  }

  getAllByLanguage(language: string) {
    return this.getAll().filter(e => e.language === language);
  }

  getFirstByLanguage(lan: string) {
    const result = this.getAllByLanguage(lan);
    return result.length > 0 ? result[0] : null;
  }
}
