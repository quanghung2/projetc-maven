import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CrConfig } from '@b3networks/api/bizphone';
import { tap } from 'rxjs/operators';
import { IsdnNumber } from './isdn-number.model';
import { IsdnNumberStore } from './isdn-number.store';

@Injectable({ providedIn: 'root' })
export class IsdnNumberService {
  constructor(private isdnNumberStore: IsdnNumberStore, private http: HttpClient) {}

  get() {
    return this.http.get<IsdnNumber[]>('/sim/private/isdnNumbers').pipe(
      tap(entities => {
        entities.forEach(e => {
          e.crConfig = new CrConfig(e.crConfig);
          if (e.isAllowedToConfig == null) {
            e.isAllowedToConfig = true;
          }
        });
        this.isdnNumberStore.upsertMany(entities);
      })
    );
  }

  update(number: string, isdnNumber: Partial<IsdnNumber>) {
    return this.http.put<IsdnNumber>(`/sim/private/isdnNumbers/${number}`, isdnNumber).pipe(
      tap(result => {
        result.crConfig = new CrConfig(result.crConfig);
        if (result.isAllowedToConfig == null) {
          result.isAllowedToConfig = true;
        }
        this.isdnNumberStore.update(number, result);
      })
    );
  }
}
