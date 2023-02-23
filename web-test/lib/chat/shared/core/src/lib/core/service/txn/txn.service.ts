import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Txn as CcTxn, TxnType } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { Contact } from '@b3networks/api/contact';
import { guid, ID } from '@datorama/akita';
import { unionBy } from 'lodash';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TxnUI } from './txn-ui.model';
import {
  AssignedMode,
  AssignLeftReq,
  RequestFilterTxns,
  RequestGetAllTxns,
  RequestUpdateTxns,
  RespActivePendingTxn,
  Txn,
  TxnGroupBy,
  TxnStatus
} from './txn.model';
import { TxnQuery } from './txn.query';
import { TxnStore } from './txn.store';

@Injectable({
  providedIn: 'root'
})
export class TxnService {
  listNotifyAssign2Me: string[] = []; // txnUuid

  constructor(private http: HttpClient, private store: TxnStore, private query: TxnQuery) {}

  fetchActiveTxns(types?: TxnType[], findTxns?: string[]): Observable<RespActivePendingTxn> {
    let params = new HttpParams();
    if (types) {
      params = params.append('type', types.join(','));
    }
    if (findTxns) {
      params = params.append('txnUuids', findTxns.join(','));
    }
    return this.http.get<CcTxn[]>(`callcenter/private/v2/active-txn`, { params: params }).pipe(
      map(res => res.filter(x => !!x.customer)),
      map((res: CcTxn[]) => {
        const txns = res
          .map(
            item =>
              new Txn(<Partial<Txn>>{
                txnUuid: item?.txnUuid,
                txnType: item?.type,
                customerUuid: item?.customer?.uuid,
                createdAt: item?.startedAtByUnix,
                lastAssignedAgents: item?.lastAssignedAgents?.map(x => x?.id?.identityUuid) || [],
                closed: false,
                channel: item.channel,
                unreadCount: item.unreadCount || 0,
                metadata: item?.metadata || {}
              })
          )
          .filter(i => i.txnType !== TxnType.booking);

        let contacts = res.filter(x => !!x.customer).map(txn => new Contact(txn.customer)) || [];
        contacts = unionBy(contacts, 'uuid');

        return <RespActivePendingTxn>{ txns, contacts };
      }),
      tap(data => this.store.upsertMany(data.txns, { baseClass: Txn }))
    );
  }

  getPending(pageable?: Pageable): Observable<RespActivePendingTxn> {
    if (!pageable) {
      pageable = <Pageable>{ page: 1, perPage: 50 };
    }
    const params = new HttpParams().set('page', pageable.page.toString()).set('perPage', pageable.perPage.toString());
    return this.http.get<any[]>('callcenter/private/v1/pending-chat-txn', { params: params }).pipe(
      tap(txns => {
        this.store.update({
          statePending: {
            hasMore: txns.length === pageable.perPage,
            page: pageable.page,
            perPage: pageable.perPage
          }
        });
      }),
      map(res => res.filter(x => !!x.customer)),
      map((res: any[]) => {
        const txns = res
          .map(
            item =>
              new Txn(<Partial<Txn>>{
                txnUuid: item?.uuid,
                txnType: item?.txnType,
                customerUuid: item?.customer?.uuid,
                createdAt: new Date(item?.createdAt).getTime(),
                lastAssignedAgents: [],
                closed: false,
                channel: item.channel,
                unreadCount: item.unreadCount || 0,
                metadata: item?.metadata || {}
              })
          )
          .filter(i => i.txnType !== TxnType.booking);

        let contacts = res.filter(x => !!x.customer).map(txn => new Contact(txn.customer)) || [];
        contacts = unionBy(contacts, 'uuid');

        return <RespActivePendingTxn>{ txns, contacts };
      }),
      tap(data => this.store.upsertMany(data.txns, { baseClass: Txn }))
    );
  }

  assign(req: AssignLeftReq) {
    return this.http.post<void>('callcenter/private/v1/chat/txn/assign', req);
  }

  archive(convoId: string) {
    return this.http.post<void>(`callcenter/private/v1/chat/txn/end`, { txnUuid: convoId });
  }

  left(req: AssignLeftReq) {
    return this.http.post<void>(`callcenter/private/v1/chat/txn/left`, req);
  }

  join(convoId: string) {
    return this.http.post<void>(`workspace/private/v1/chat/${convoId}/join`, null);
  }

  endOneTxn(txnUuid: string) {
    return this.http.post<void>(`callcenter/private/v1/chat/txn/end`, { txnUuid });
  }

  endTxns(txnUuids: string[]) {
    return this.http.post<void>(`callcenter/private/v2/chat/txn/end`, { txnUuids });
  }

  endTxnsV2(txnUuids: string[]) {
    return this.http.post(`inbox/private/v2/livechat/_end`, { txnUuids: txnUuids });
  }

  joinTxnV2(txnUuid: string, agentUuid: string) {
    return this.http.post(`inbox/private/v2/txn/${txnUuid}/_assign`, { agentUuid: agentUuid });
  }

  leftTxnV2(txnUuid: string, agentUuid: string) {
    return this.http.post(`inbox/private/v2/txn/${txnUuid}/_unassign`, { agentUuid: agentUuid });
  }

  updateTxnV2(txnUuid: string, req: RequestUpdateTxns) {
    return this.http.put<Txn>(`inbox/private/v2/txn/${txnUuid}`, req).pipe(
      map(txn => new Txn(txn)),
      tap(txn => this.store.upsert(txnUuid, txn))
    );
  }

  // role agent cannot display all active txns -> recall get all txns by customer
  getTxnsActiveByCustomer(customerUuid: string, pageable: Pageable): Observable<Txn[]> {
    let params = new HttpParams().append('customerUuid', customerUuid);
    if (pageable?.page) {
      params = params.append('page', pageable.page.toString());
    }

    if (pageable?.perPage) {
      params = params.append('perPage', pageable.perPage.toString());
    }
    return this.http.get<any[]>('callcenter/private/v1/txns', { params: params }).pipe(
      map(res =>
        res.map(item => {
          const data = new Txn(<Partial<Txn>>{
            txnUuid: item.uuid,
            txnType: item.txnType,
            customerUuid: item.customerUuid,
            createdAt: new Date(item.createdAt).getTime(),
            channel: item.channel,
            metadata: item?.metadata || {}
          });
          if (item.taggedToCase) {
            data.caseCode = guid();
          }
          if (item?.status === 'ended') {
            data.closed = true;
          }
          return data;
        })
      ),
      map(x => x.filter(i => i.txnType !== TxnType.booking)),
      tap(txnList => this.store.upsertMany(txnList, { baseClass: Txn }))
    );
  }

  // active, close
  getTxnsByCustomer(req: RequestGetAllTxns): Observable<Txn[]> {
    let params = new HttpParams();
    Object.keys(req).forEach(key => {
      if (req[key]) {
        params = params.append(key, String(req[key]));
      }
    });

    return this.http.get<any[]>('callcenter/private/v2/txns', { params: params }).pipe(
      map(res =>
        res.map(item => {
          const data = new Txn(<Partial<Txn>>{
            txnUuid: item.uuid,
            txnType: item.txnType,
            customerUuid: item.customerUuid,
            createdAt: new Date(item.createdAt).getTime(),
            channel: item.channel,
            unreadCount: 0,
            metadata: item?.metadata || {}
          });
          if (item.taggedToCase) {
            data.caseCode = guid();
          }
          if (item?.status === 'ended') {
            data.closed = true;
          }
          return data;
        })
      ),
      map(x => x.filter(i => i.txnType !== TxnType.booking)),
      tap(txnList => this.store.upsertMany(txnList, { baseClass: Txn }))
    );
  }

  // queryTxn v2
  getTxnByFilter(req: RequestFilterTxns, pageable: Pageable, meIdentity: string): Observable<RespActivePendingTxn> {
    let params = new HttpParams();
    Object.keys(pageable).forEach(key => {
      if (pageable[key]) {
        params = params.append(key, String(pageable[key]));
      }
    });

    return this.http.post<Txn[]>('inbox/private/v2/txn/_query', req, { params: params }).pipe(
      tap(txns => {
        if (req.groupBy === TxnGroupBy.txn) {
          if (req.status === TxnStatus.active) {
            this.store.update({
              stateActiveV2: {
                hasMore: txns.length === pageable.perPage,
                page: pageable.page,
                perPage: pageable.perPage
              }
            });
          } else if (req.status === TxnStatus.pending) {
            this.store.update({
              statePendingV2: {
                hasMore: txns.length === pageable.perPage,
                page: pageable.page,
                perPage: pageable.perPage
              }
            });
          }
        }
      }),
      map(res => {
        let txns: Txn[] = [];
        let contacts: Contact[] =
          res
            ?.filter(x => !!x?.['customer'])
            ?.map(
              txn =>
                new Contact({
                  uuid: txn?.['customer']?.['uuid'],
                  displayName: txn?.['customer']?.['displayName'],
                  chatCustomerId: txn?.['customer']?.['chatUserId']
                })
            ) || [];
        contacts = unionBy(contacts, 'uuid');

        if (req.groupBy === TxnGroupBy.customer) {
          res.forEach(item => {
            Object.keys(item?.['txnMap'] || {})?.forEach(key => {
              const txn = item?.['txnMap'][key];
              const teamUnread = !txn?.teamConvoUnread || txn?.teamConvoUnread < 0 ? 0 : txn?.teamConvoUnread;
              const data = new Txn(<Partial<Txn>>{
                txnUuid: txn.publicConvo,
                publicConvoId: txn.publicConvo,
                teamConvoId: txn.teamConvoId,
                channel: txn.channel,
                unreadCount: (txn?.publicConvoUnread || 0) + teamUnread,
                createdAt: txn?.createdAt,
                inboxUuid: item.inboxUuid,
                customerUuid: item?.['customer']?.uuid,
                customerName: item?.['customer']?.name,
                closed: false,
                isTemporary: true
              });

              if (
                req.assignedMode === AssignedMode.me &&
                (!data.lastAssignedAgents || data.lastAssignedAgents?.length === 0) &&
                !data.lastAssignedAgents?.includes(meIdentity)
              ) {
                data.lastAssignedAgents = [meIdentity];
              }

              if (req.status === TxnStatus.pending) {
                data.lastAssignedAgents = [];
              }

              if (req?.status === TxnStatus.ended) {
                data.closed = true;
              }
              txns.push(data);
            });
          });
        } else {
          // groupby txn
          txns = res.map(item => {
            const data = new Txn(<Partial<Txn>>{
              txnUuid: item?.txnUuid,
              inboxUuid: item.inboxUuid,
              teamConvoId: item.teamConvoId,
              publicConvoId: item?.publicConvoId,
              metadata: item?.metadata || {},
              lastAssignedAgents: item?.['assignees'] || undefined,
              customerUuid: item?.['customer']?.uuid || undefined,
              customerName: item?.['customer']?.name || undefined,
              createdAt: item.createdAt,
              channel: item.channel || undefined,
              closed: false,
              isTemporary: true
            });

            if (
              req.assignedMode === AssignedMode.me &&
              (!data.lastAssignedAgents || data.lastAssignedAgents?.length === 0) &&
              !data.lastAssignedAgents?.includes(meIdentity)
            ) {
              data.lastAssignedAgents = [meIdentity];
            }

            if (req.status === TxnStatus.pending) {
              data.lastAssignedAgents = [];
            }

            if (req?.status === TxnStatus.ended) {
              data.closed = true;
            }
            return data;
          });
        }

        return <RespActivePendingTxn>{ txns, contacts };
      }),
      tap(txnList => this.store.upsertMany(txnList.txns, { baseClass: Txn }))
    );
  }

  getDetailTxn(txnUuid: string) {
    return this.http.get<Txn>(`inbox/private/v2/txn/${txnUuid}`).pipe(
      map(item => {
        const txn = new Txn(<Partial<Txn>>{
          txnUuid: item?.txnUuid,
          customerUuid: item?.['customerUuid'] || undefined,
          teamConvoId: item?.teamConvoId,
          publicConvoId: item?.publicConvoId,
          inboxUuid: item.inboxUuid,
          metadata: item?.metadata || {},
          channel: item.channel || undefined,
          lastAssignedAgents: item?.['assignees'] || undefined,
          createdAt: item.createdAt,
          typeId: item.typeId,
          productIds: item.productIds,
          severityId: item.severityId,
          isTemporary: false
        });

        return txn;
      }),
      tap(txn => this.store.upsertMany([txn], { baseClass: Txn }))
    );
  }

  getTxnByCustomer(statusList: TxnStatus[], customerUuid: string, inboxUuid: string): Observable<Txn[]> {
    let params = new HttpParams();
    if (customerUuid) {
      params = params.append('customerUuid', customerUuid);
    }

    if (statusList?.length) {
      params = params.append('status', statusList.join(','));
    }

    if (inboxUuid) {
      params = params.append('inboxUuid', inboxUuid);
    }

    return this.http.get<Txn[]>('inbox/private/v2/txn/_getByCustomer', { params: params }).pipe(
      map(res => {
        let txns: Txn[] = [];
        txns = res.map(item => {
          const store = this.query.getEntity(item.txnUuid);
          const data = new Txn(<Partial<Txn>>{
            customerUuid: customerUuid, // mapping customer
            txnUuid: item?.txnUuid,
            publicConvoId: item?.publicConvoId,
            inboxUuid: item.inboxUuid,
            teamConvoId: item.teamConvoId,
            metadata: item?.metadata || {},
            channel: item.channel || undefined,
            createdAt: item.createdAt,
            isTemporary: store?.isTemporary
          });

          if (item?.['status'] === TxnStatus.ended) {
            data.closed = true;
          }
          return data;
        });
        return txns;
      }),
      tap(txnList => this.store.upsertMany(txnList, { baseClass: Txn }))
    );
  }

  updateLoaded(loaded: boolean) {
    this.store.update({ loaded: loaded });
  }

  updateLoadedV2(loaded: boolean) {
    this.store.update({ loadedV2: loaded });
  }

  updateTxn2Store(txnUuid: string | ID, data: Partial<Txn>) {
    this.store.upsert(txnUuid, data, { baseClass: Txn });
  }

  updateTxns2Store(data: Partial<Txn[]>) {
    this.store.upsertMany(data, { baseClass: Txn });
  }

  updateTxnViewState(txnUuid: string | string[], state: Partial<TxnUI>) {
    this.store.ui.update(txnUuid, entity => ({
      ...entity,
      ...state
    }));
  }

  markSeen(txnUuid: string) {
    this.store.update(txnUuid, { unreadCount: 0 });
  }

  countUnread(txnUuid: string) {
    const txn = this.query.getEntity(txnUuid);
    if (txn) {
      this.store.update(txnUuid, { unreadCount: (txn.unreadCount || 0) + 1 });
    }
  }
}
