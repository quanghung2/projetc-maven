import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { Product } from './product';
import { ProductStore } from './product.store';

@Injectable({ providedIn: 'root' })
export class ProductQuery extends QueryEntity<Product> {
  products$ = this.selectAll();

  constructor(protected override store: ProductStore) {
    super(store);
  }
}
