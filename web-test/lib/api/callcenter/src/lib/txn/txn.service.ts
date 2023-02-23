import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { FinishACWReq } from './model/finish-acw.model';
import { SupervisorSpyAction } from './model/spy-action.enum';
import { TakeNoteReq } from './model/take-note-req.model';
import { TxnType } from './model/txn.enum';
import { Txn, TxnFilter } from './model/txn.model';
import { TxnQuery } from './txn.query';
import { TxnStore } from './txn.store';

@Injectable({
  providedIn: 'root'
})
export class TxnService {
  constructor(private http: HttpClient, private store: TxnStore, private txnQuery: TxnQuery) {}

  fetchActiveTxns(types: TxnType[]) {
    const params = types ? { type: types.join(',') } : null;

    return this.http
      .get<Txn[]>(`callcenter/private/v1/active-txn`, { params: params })
      .pipe(
        map(res => res.map(obj => new Txn(obj))),
        tap(txnList => this.store.upsertMany(txnList))
      );
  }

  takeAction(txnUuid: string, action: SupervisorSpyAction): Observable<any> {
    return this.http.put<any>(`callcenter/private/v1/txns/${txnUuid}/${action}`, {});
  }

  updateFilter(filter: TxnFilter) {
    this.store.updateFilter(filter);
  }

  finishAcw(req: FinishACWReq) {
    const type = req.type;
    delete req.type;
    return this.http.post<void>(`callcenter/private/v1/${type}/agent/finishAcw`, req);
  }

  takeNote(req: TakeNoteReq): Observable<any> {
    return this.http.post<void>('callcenter/private/v1/txn/agent/takeNote', req);
  }
}
