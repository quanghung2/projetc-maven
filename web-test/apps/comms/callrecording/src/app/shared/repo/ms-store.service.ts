import { forwardRef, Inject, Injectable } from '@angular/core';
import { User } from '../model';
import { BackendService } from '../service/backend.service';
import { UserService } from '../service/user.service';
import { environment } from './../../../environments/environment';

const STORE_PATH = '/store/private/v1';

@Injectable()
export class MsStore {
  private msEndpoint: string = environment.api.endpoint;

  private user: User = new User();
  private products: Object = new Object();
  private skus: Object = new Object();

  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService,
    @Inject(forwardRef(() => UserService)) private userService: UserService
  ) {
    this.userService.subscribe(user => this.user.update(user));
  }

  getProducts(productIds: Array<string>, force: boolean = false): Promise<any> {
    return this.userService
      .getProfile()
      .then(user => {
        if (!this.user.domain) {
          console.error('User domain not found!', this.user);
          return null;
        }

        const waiters = [];
        productIds.forEach(productId => {
          const waiter = this.getProduct(this.user.domain, productId);
          if (waiter) {
            waiters.push(waiter);
          }
        });
        return Promise.all(waiters);
      })
      .then(products => {
        const res = {};
        products.forEach(product => {
          res[product.productId] = product;
        });
        return res;
      });
  }

  private getProduct(domain: string, productId: string) {
    if (this.products[productId]) {
      return Promise.resolve(this.products[productId]);
    }

    // return this.backendService.get(this.backendService.parseApiUrl(
    //     `${STORE_PATH}/domains/${domain}/products/${productId}`,
    //     false,
    //     this.msEndpoint
    //   ), {
    //     includeAll: true
    //   })
    //   .then((data: any) => {
    //     this.products[productId] = data;
    //     return data;
    //   });

    return null;
  }

  getSkus(productIds: Array<string>, force: boolean = false): Promise<any> {
    // if (!force) {
    //   return Promise.resolve(this.skus);
    // }
    console.log('productIds', productIds);

    return this.userService
      .getProfile()
      .then(user => {
        if (!this.user.domain) {
          console.error('User domain not found!', this.user);
          return null;
        }

        const waiters = [];
        productIds.forEach(productId => {
          const waiter = this.getSku(this.user.domain, productId);
          waiters.push(waiter);
        });
        return Promise.all(waiters);
      })
      .then(products => {
        const res = {};
        products.forEach(skus => {
          skus.forEach(sku => {
            res[sku.sku] = sku;
          });
        });
        return res;
      });
  }

  private getSku(domain: string, productId: string) {
    return this.backendService
      .get(
        this.backendService.parseApiUrl(
          `${STORE_PATH}/domains/${domain}/products/${productId}/skus`,
          false,
          this.msEndpoint
        ),
        {
          includeAll: true
        }
      )
      .then((data: any) => {
        this.skus[productId] = data;
        return data;
      });
  }
}
