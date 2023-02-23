import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ID } from '@datorama/akita';
import { finalize, map, tap } from 'rxjs/operators';
import { CreateOrderReq, GetOrderReq, Order } from './order.model';
import { OrderStore } from './order.store';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { Page, Pageable } from '@b3networks/api/common';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private orderStore: OrderStore, private http: HttpClient) {}

  get(req?: GetOrderReq, pageable?: Pageable): Observable<Page<Order>> {
    let params = new HttpParams();

    if (req) {
      Object.keys(req)
        .filter(p => req[p] != null)
        .forEach(p => {
          if (p === 'statuses' && req.statuses.length) {
            params = params.set('statuses', req.statuses.join(','));
          } else {
            params = params.set(p, req[p]);
          }
        });
    }
    if (pageable) {
      params = params.set('page', String(pageable.page)).set('size', String(pageable.perPage));
    }

    this.orderStore.setLoading(true);
    return this.http
      .get<Order[]>(`license/private/v1/orders`, { params: params, observe: 'response' })
      .pipe(
        map(resp => {
          const content = resp.body.map(o => new Order(o));
          const totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
          return {
            content: content,
            totalCount: totalCount
          } as Page<Order>;
        }),
        tap(p => {
          this.orderStore.set(p.content);
        }),
        finalize(() => this.orderStore.setLoading(false))
      );
  }

  getOne(id: ID) {
    return this.http.get<Order>(`license/private/v1/orders/${id}`).pipe(
      map(o => new Order(o)),
      tap(entity => {
        this.orderStore.upsert(id, entity);
      })
    );
  }

  create(req: CreateOrderReq) {
    return this.http.post<Order>(`license/private/v1/orders`, req).pipe(
      map(o => new Order(o)),
      tap(entity => {
        entity.createdAt = entity.createdAt || new Date().getTime();
        entity.updatedAt = entity.updatedAt || new Date().getTime();
        this.orderStore.add(entity);
      })
    );
  }

  update(id: ID, bundle: Partial<Order>) {
    return this.http.put<Order>(`license/private/v1/orders/${id}`, bundle).pipe(
      map(o => new Order(o)),
      tap(entity => {
        entity.updatedAt = entity.updatedAt || new Date().getTime();
        this.orderStore.update(id, entity);
      })
    );
  }

  remove(id: ID) {
    return this.http.delete<void>(`license/private/v1/orders/${id}`).pipe(
      tap(_ => {
        this.orderStore.remove(id);
      })
    );
  }

  approve(id: ID, remark?: string) {
    return this.http
      .post<Order>(`license/private/v1/orders/${id}/approve`, { remark: remark })
      .pipe(
        map(o => new Order(o)),
        tap(o => this.orderStore.update(id, o))
      );
  }

  reject(id: ID, remark?: string) {
    return this.http
      .post<Order>(`license/private/v1/orders/${id}/reject`, { remark: remark })
      .pipe(
        map(o => new Order(o)),
        tap(o => this.orderStore.update(id, o))
      );
  }
}
