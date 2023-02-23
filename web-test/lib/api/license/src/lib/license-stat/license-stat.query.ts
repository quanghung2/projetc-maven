import { Injectable } from '@angular/core';
import { Order, QueryConfig, QueryEntity } from '@datorama/akita';
import { LicenseStatistic } from './license-stat.model';
import { LicenseStatState, LicenseStatStore } from './license-stat.store';

const sortBy = (a: LicenseStatistic, b: LicenseStatistic) => {
  return a.type.localeCompare(b.type) * -1 || a.skuName.localeCompare(b.skuName);
};

@QueryConfig({
  sortBy: 'skuName',
  sortByOrder: Order.ASC
})
@Injectable({ providedIn: 'root' })
export class LicenseStatQuery extends QueryEntity<LicenseStatState> {
  allLienses$ = this.selectAll({
    sortBy: sortBy
  });

  baseLicenses$ = this.selectAll({
    filterBy: e => e.type === 'BASE',
    sortBy: sortBy
  });

  perUserBaseLicenses$ = this.selectAll({
    filterBy: e => e.type === 'BASE' && e.isPerUserLicense,
    sortBy: sortBy
  });

  addonLicenses$ = this.selectAll({
    filterBy: e => e.type === 'ADDON',
    sortBy: sortBy
  });

  constructor(protected override store: LicenseStatStore) {
    super(store);
  }

  getBySKU(sku: string) {
    return this.getEntity(sku);
  }

  getAllAddonLicenses() {
    return this.getAll().filter(l => l.type === 'ADDON');
  }

  getNumberLicense() {
    return this.getAll().find(l => l.isNumber);
  }

  getSimLicense() {
    return this.getAll().find(l => l.isSim);
  }
}
