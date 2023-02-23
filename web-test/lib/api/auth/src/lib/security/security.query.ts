import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { SecurityCompliance } from './security';
import { SecurityComplianceStore } from './security.store';

@Injectable({ providedIn: 'root' })
export class SecurityComplianceQuery extends Query<SecurityCompliance> {
  securityCompliance$ = this.select();

  constructor(protected override store: SecurityComplianceStore) {
    super(store);
  }
}
