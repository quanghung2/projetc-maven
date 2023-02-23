import { Injectable } from '@angular/core';
import { AsyncSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RouteService {
  domain: AsyncSubject<string> = new AsyncSubject<string>();
  supportedCurrencies: AsyncSubject<string[]> = new AsyncSubject();

  constructor() {}
}
