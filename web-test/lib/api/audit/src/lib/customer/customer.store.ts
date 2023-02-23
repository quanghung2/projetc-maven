import { Injectable } from '@angular/core';
import { TimeRangeKey } from '@b3networks/shared/common';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { AuditEventName, AuditFilter, ModuleDescription } from './customer.model';

export interface AuditSearchState extends EntityState<AuditEventName> {
  ui: {
    lastTimeFilter: TimeRangeKey;
    moduleFilter: ModuleDescription | any;
    actionFilter: string;
    userFilter: string;
    startDate: Date;
    endDate: Date;
    queryFilter: string;
  };
}

const initialState = {
  ui: {
    lastTimeFilter: TimeRangeKey['15m'],
    moduleFilter: '',
    actionFilter: '',
    userFilter: '',
    queryFilter: '',
    startDate: null,
    endDate: null
  }
};

@Injectable({
  providedIn: 'root'
})
@StoreConfig({ name: 'audit_customer-audit', idKey: 'moduleName' })
export class CustomerStore extends EntityStore<AuditSearchState> {
  constructor() {
    super(initialState);
  }

  updateAuditFilter(obj: Partial<AuditFilter>) {
    this.update(state => ({ ...state, ui: { ...state.ui, ...obj } }));
  }
}
