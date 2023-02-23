import { Injectable } from '@angular/core';
import { EntityStore, StoreConfig } from '@datorama/akita';
import { Product } from './product';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'store_product', idKey: 'productId' })
export class ProductStore extends EntityStore<Product> {
  constructor() {
    super();
  }
}
