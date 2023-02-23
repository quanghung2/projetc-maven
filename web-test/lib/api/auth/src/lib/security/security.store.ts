import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { SecurityCompliance } from './security';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_security_compliance' })
export class SecurityComplianceStore extends Store<SecurityCompliance> {
  constructor() {
    super({});
  }
}
