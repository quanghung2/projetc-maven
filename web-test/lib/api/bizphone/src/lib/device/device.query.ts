import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { DeviceState, DeviceStore } from './device.store';

@Injectable({ providedIn: 'root' })
export class DeviceQuery extends QueryEntity<DeviceState> {
  devices$ = this.selectAll();

  constructor(protected override store: DeviceStore) {
    super(store);
  }

  selectDevices(filter: { searchQuery?: string; unassignedOnly: boolean }) {
    return this.selectAll({
      filterBy: e => {
        let expression = true;
        if (filter) {
          const q = filter.searchQuery?.toLocaleLowerCase();
          expression =
            expression &&
            (q
              ? e.deviceUuid?.toLocaleLowerCase().search(q) > -1 ||
                e.name?.toLocaleLowerCase().search(q) > -1 ||
                e.ext?.search(q) > -1 ||
                e.extLabel?.toLocaleLowerCase().search(q) > -1
              : true);
          expression = expression && (filter.unassignedOnly ? !e.ext : true);
        }

        return expression;
      }
    });
  }

  selectAutoProvision() {
    return this.select(s => s.isAutoProvisioning);
  }

  selectDeleting() {
    return this.select(s => s.isDeleting);
  }
}
