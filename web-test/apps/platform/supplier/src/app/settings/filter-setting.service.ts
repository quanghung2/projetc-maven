import { Injectable } from '@angular/core';
import { FilterSetting } from './filter-setting.model';
import { FilterSettingStore } from './filter-setting.store';

@Injectable({
  providedIn: 'root'
})
export class FilterSettingService {
  constructor(private store: FilterSettingStore) {}

  updatefilterSetting(filters: FilterSetting) {
    this.store.update(<FilterSetting>{
      supplier: filters.supplier,
      routing: filters.routing,
      mappings: filters.mappings
    });
  }
}
