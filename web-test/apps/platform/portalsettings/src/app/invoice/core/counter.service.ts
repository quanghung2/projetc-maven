import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Counter } from './counter.model';

@Injectable({ providedIn: 'root' })
export class CounterService {
  constructor(private httpClient: HttpClient) {}

  getQuoteCounter(): Observable<Counter> {
    return this.httpClient.get(`/invoice/private/v2/quote_counter`).pipe(map(o => this.toModel(o)));
  }

  updateQuoteCounter(counter: Counter): Observable<any> {
    return this.httpClient.put(`/invoice/private/v2/quote_counter`, counter);
  }

  getInvoiceCounters(domain: string): Observable<Counter[]> {
    return this.httpClient
      .get<Array<any>>(`/invoice/private/v2/counters`)
      .pipe(map(res => res.map(r => this.toModel(r))));
  }

  updateInvoiceCounter(domain: string, counter: Counter): Observable<any> {
    return this.httpClient.put(`/invoice/private/v2/counters`, [counter]);
  }

  toModel(r: any): Counter {
    const c = new Counter();
    c.type = r['type'];
    c.prefix = r['prefix'];
    c.length = r['length'];
    c.current = r['current'];
    return c;
  }
}
