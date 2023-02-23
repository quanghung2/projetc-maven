import { Injectable } from '@angular/core';
import { CaseFiltering, SearchQuery } from './filter-setting.model';
import { FilterSettingStore } from './filter-setting.store';

@Injectable({
  providedIn: 'root'
})
export class FilterSettingService {
  constructor(private store: FilterSettingStore) {}

  updateFilterSetting(filters: Partial<CaseFiltering>) {
    console.log(filters);

    this.store.update(filters);
  }

  updateSearchSetting(searchQuery: SearchQuery) {
    this.store.update({
      searchQuery: searchQuery
    });
  }
}
