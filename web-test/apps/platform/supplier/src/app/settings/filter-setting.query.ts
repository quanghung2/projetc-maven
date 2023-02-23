import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { FilterSetting } from './filter-setting.model';
import { FilterSettingStore } from './filter-setting.store';

@Injectable({
  providedIn: 'root'
})
export class FilterSettingQuery extends Query<FilterSetting> {
  filterSetting$ = this.select();

  constructor(protected override store: FilterSettingStore) {
    super(store);
  }
}
