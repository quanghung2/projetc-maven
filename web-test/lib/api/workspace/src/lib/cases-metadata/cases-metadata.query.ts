import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { CaseMetaData } from './cases-metadata.model';
import { CaseMetaDataStore } from './cases-metadata.store';

@Injectable({ providedIn: 'root' })
export class SCMetaDataQuery extends Query<CaseMetaData> {
  scMetaData$ = this.select();

  productList$ = this.select('productList');
  typeList$ = this.select('caseTypeList');
  severityList$ = this.select('caseSeverityList');
  suppliers$ = this.select('suppliers');

  constructor(store: CaseMetaDataStore) {
    super(store);
  }

  getProductById(productId: number) {
    return this.getValue().productList?.find(x => x.id === productId);
  }

  hasLoaded() {
    return this.getValue()?.loaded;
  }
}
