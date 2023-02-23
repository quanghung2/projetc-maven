import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { CaseFiltering } from './filter-setting.model';
import { FilterSettingStore } from './filter-setting.store';

@Injectable({
  providedIn: 'root'
})
export class FilterSettingQuery extends Query<CaseFiltering> {
  caseFilter$ = this.select();

  getFilter = () => this.getValue();

  constructor(override store: FilterSettingStore) {
    super(store);
  }
}
