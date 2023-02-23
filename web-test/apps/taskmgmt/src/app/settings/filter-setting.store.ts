import { Injectable } from '@angular/core';
import { CaseStatus } from '@b3networks/api/workspace';
import { Store, StoreConfig } from '@datorama/akita';
import { CaseFiltering, SearchBy, SearchQuery } from './filter-setting.model';

export function createInitialState(): CaseFiltering {
  return <CaseFiltering>{
    status: CaseStatus.open,
    searchQuery: <SearchQuery>{ type: SearchBy.titleDesc, value: '' },
    activeTab: 'assigned2me'
  };
}

@Injectable({
  providedIn: 'root'
})
@StoreConfig({ name: 'taskmgmt_settings-filter' })
export class FilterSettingStore extends Store<CaseFiltering> {
  constructor() {
    super(createInitialState());
  }
}
