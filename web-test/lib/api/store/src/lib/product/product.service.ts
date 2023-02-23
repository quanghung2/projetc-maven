import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IdentityProfileQuery, RealDomainService } from '@b3networks/api/auth';
import { SaleModelService, SalesModel } from '@b3networks/api/salemodel';
import {
  AddProductReq,
  GetAllProductReq,
  GetAvailableProductReq,
  PricingService,
  Product,
  Sku,
  TypeProduct
} from '@b3networks/api/store';
import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap, share, tap } from 'rxjs/operators';

class ProductDict {
  type: string;
  products: Product[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsDict: ProductDict = new ProductDict();
  private productObservable: Observable<Product[]>;
  private productTypes: TypeProduct[];
  private productTypeOb: Observable<TypeProduct[]>;

  salesModels: SalesModel[] = [];

  constructor(
    private http: HttpClient,
    private realDomainService: RealDomainService,
    private saleModelService: SaleModelService,
    private profileQuery: IdentityProfileQuery,
    private pricingService: PricingService
  ) {}

  getAllProduct(domain: string, request: GetAllProductReq): Observable<Product[]> {
    const query = new HttpParams().set('includeDescription', String(request?.includeDescription));
    if (request?.productIds?.length) {
      query.set('productIds', request.productIds.join());
    }
    return this.http
      .get<Product[]>(`/store/private/v1/domains/${domain}/products`, {
        params: query
      })
      .pipe(map(list => list.map(i => new Product(i))));
  }

  geAvailableProducts(req?: GetAvailableProductReq): Observable<Product[]> {
    let params = new HttpParams();
    if (req) {
      params = !!req.type ? params.set('type', req.type) : params;
    }
    return this.http
      .get<Product[]>(`/store/private/v2/app/products`, { params })
      .pipe(map(res => res.map(item => new Product(item))));
  }

  getDistributingProducts(channelDomain: string): Observable<Product[]> {
    const requestParam = new HttpParams().append('channelDomain', channelDomain);
    return this.http
      .get<Product[]>(`/store/private/v2/app/distributingproducts`, {
        params: requestParam
      })
      .pipe(map(res => res.map(item => new Product(item))));
  }

  addProducts(req: AddProductReq): Observable<any> {
    return this.http.post(`/store/private/v2/app/distributingproducts/add`, req);
  }

  getProductNumberDetail(domain: string): Observable<Product[]> {
    return this.http.get<Product[]>(`/store/private/v1/domains/${domain}/products?type=NUMBER`);
  }

  fetchProducts(type: any, page?: number, pageSize?: number): Observable<Array<Product>> {
    if (this.productsDict[type]) {
      return of(this.productsDict[type]);
    }

    page = page || 1;

    let params = new HttpParams();
    params = params.set('page', page + '');
    params = params.set('pageSize', pageSize + '');
    params = params.set('includeDescription', 'true');

    this.productObservable = this.realDomainService.getRealDomainFromPortalDomain().pipe(
      mergeMap(domain => {
        const url = `store/private/v1/domains/${domain.domain}/products?type=${type}`;
        return this.http.get(url, { params });
      }),
      map((resList: any) => {
        const products: Array<Product> = new Array();
        resList.forEach(element => {
          products.push(new Product(element));
        });
        products.sort((a, b) => {
          if (a.name.toLowerCase() < b.name.toLocaleLowerCase()) {
            return -1;
          } else if (a.name.toLowerCase() > b.name.toLocaleLowerCase()) {
            return 1;
          } else {
            return 0;
          }
        });
        return products;
      }),
      tap(products => (this.productsDict[type] = products)),
      share()
    );

    return this.productObservable;
  }

  getProduct(productId: string): Observable<Product> {
    const product = this.getProductFromCache(productId);
    if (product) {
      return of(new Product(product));
    }

    return this.realDomainService.getRealDomainFromPortalDomain().pipe(
      mergeMap(domain => {
        const url = `store/private/v1/domains/${domain.domain}/products/${productId}?includeDescription=true`;
        return this.http.get(url);
      }),
      map(res => new Product(res))
    );
  }

  getProductDetail(productId: string, currency: string) {
    return forkJoin([this.getProduct(productId), this.fetchSkusWithPricing(productId, currency)]).pipe(
      map(data => {
        data[0].skus = data[1];
        return data[0];
      })
    );
  }

  fetchSkusWithPricing(productId: string, currency: string): Observable<Sku[]> {
    const product = this.getProductFromCache(productId);

    if (product && product.skus) {
      return of(product.skus);
    }

    const ob = forkJoin([this.fetchSkus(productId), this.saleModelService.fetchPricing(productId, currency)]).pipe(
      map(data => {
        const primarySkus: Sku[] = data[0];
        const allSkusWithPricing: Partial<Sku>[] = data[1];

        primarySkus.forEach(primarySku => {
          const skuWithPicing = allSkusWithPricing.find(sku => sku.code === primarySku.code);
          if (skuWithPicing) {
            primarySku.salesModels = skuWithPicing.salesModels;
          }

          primarySku.salesModels.forEach(async s => {
            if (!this.salesModels.find(saleModel => saleModel.code === s.code)) {
              this.salesModels.push(s);
              await this.pricingService
                .getPriceChain({
                  productCode: productId,
                  sku: primarySku.code,
                  saleModel: s.code
                })
                .toPromise()
                .then(price => {
                  s.amount = price.finalPrice;
                });
            } else {
              return;
            }
          });
        });
        return primarySkus.filter(sku => sku.salesModels != null);
      }),
      share()
    );

    if (product) {
      ob.subscribe(skus => (product.skus = skus));
    }

    return ob;
  }

  fetchTypes(): Observable<TypeProduct[]> {
    if (this.productTypes) {
      return of(this.productTypes);
    } else if (this.productTypeOb) {
      return this.productTypeOb;
    }

    this.productTypeOb = this.realDomainService.getRealDomainFromPortalDomain().pipe(
      mergeMap(domain => {
        const url = `store/private/v1/domains/${domain.domain}/producttypes`;
        return this.http.get(url);
      }),
      map(dictionary => {
        const list: TypeProduct[] = [];
        for (const type in dictionary) {
          if (+dictionary[type] > 0 && type !== 'TELECOM' && type !== 'NUMBER') {
            list.push(new TypeProduct(type, dictionary[type]));
          }
        }
        return list;
      }),
      share()
    );

    this.productTypeOb.subscribe(types => (this.productTypes = types));

    return this.productTypeOb;
  }

  private fetchSkus(productId: string): Observable<Sku[]> {
    return this.realDomainService.getRealDomainFromPortalDomain().pipe(
      mergeMap(domain => {
        const url = `store/private/v1/domains/${domain.domain}/products/${productId}/skus`;
        return this.http.get(url);
      }),
      map((list: any) => list.map(params => Sku.buildFromReponse(params)))
    );
  }

  private getProductFromCache(productId: string) {
    let product = null;
    for (const type in this.productsDict) {
      if (this.productsDict[type]) {
        product = this.productsDict[type].find(prod => prod.productId === productId);
        if (product) {
          break;
        }
      }
    }
    return product;
  }
}
