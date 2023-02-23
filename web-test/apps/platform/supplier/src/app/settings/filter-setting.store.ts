import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { FilterSetting } from './filter-setting.model';

export function createInitialState(): FilterSetting {
  return {
    supplier: '',
    routing: '',
    mappings: ''
  };
}

@Injectable({
  providedIn: 'root'
})
@StoreConfig({ name: 'supplier_settings-filter' })
export class FilterSettingStore extends Store<FilterSetting> {
  constructor() {
    super(createInitialState());
  }
}
