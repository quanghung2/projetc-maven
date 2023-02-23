import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { Owner } from './owner.model';
import { OwnerStore } from './owner.store';

@Injectable({ providedIn: 'root' })
export class OwnerQuery extends Query<Owner> {
  currentOwner$ = this.select();
  constructor(protected override store: OwnerStore) {
    super(store);
  }
}
