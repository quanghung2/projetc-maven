import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pageable } from '@b3networks/api/common';
import { arrayAdd, arrayRemove, arrayUpdate, PaginationResponse } from '@datorama/akita';
import { map, tap } from 'rxjs/operators';
import { CaseActivity, CreateCaseCommentReq } from './case-activity';
import {
  AssigneesCase,
  Case,
  CaseDetail,
  CaseIdentity,
  CaseStatus,
  Collaborator,
  CollaboratorRole,
  NotificationsCase,
  QueryCaseReq,
  QueryCaseResp,
  RelatedCase,
  StoreCaseReq,
  UpdateCaseReq
} from './case.model';
import { CaseStore } from './case.store';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  constructor(private httpClient: HttpClient, protected store: CaseStore) {}

  queryAssigned2MeCases(req: QueryCaseReq, pageable?: Pageable, addon?: { ignoreUpdateStore: boolean }) {
    return this._queryCases(req, pageable, { assigned2meOnly: true, ...addon });
  }

  queryAllCases(req: QueryCaseReq, pageable?: Pageable, addon?: { ignoreUpdateStore: boolean }) {
    return this._queryCases(req, pageable, { ignoreUpdateStore: addon?.ignoreUpdateStore });
  }

  private _queryCases(
    req: QueryCaseReq,
    pageable?: Pageable,
    addon?: { assigned2meOnly?: boolean; ignoreUpdateStore?: boolean }
  ) {
    let params = new HttpParams();
    if (pageable) {
      params = params.set('page', String(Number(pageable.page))).set('perPage', String(pageable.perPage));
    }

    let url = `/support-center/private/v3/cases/_query`;
    if (addon?.assigned2meOnly) {
      url = `/support-center/private/v3/cases/me/_query`;
    }

    return this.httpClient.post<QueryCaseResp>(url, req, { params: params }).pipe(
      map(resp => {
        let totalCount = resp.countAll;
        if (req.status === CaseStatus.closed) {
          totalCount = resp.countClosed;
        } else if (req.status === CaseStatus.open) {
          totalCount = resp.countOpen;
        }
        const result = <PaginationResponse<CaseDetail>>{
          currentPage: pageable.page,
          perPage: pageable.perPage,
          lastPage: Math.ceil(totalCount / pageable.perPage),
          data: resp.items.map(sub => new Case(sub)),
          total: totalCount
        };

        if (!addon?.ignoreUpdateStore) {
          this.store.update({
            totalCount: resp.countAll,
            openCount: resp.countOpen,
            closedCount: resp.countClosed
          });

          this.store.set(result.data);
        }

        return result;
      })
    );
  }

  getCase(ownerUuid: string, sid: number) {
    return this.httpClient.get<CaseDetail>(`/support-center/private/v3/cases/${ownerUuid}/${sid}`).pipe(
      map(c => new CaseDetail(c)),
      tap(c => {
        if (this.store.getValue().ids.includes(c.id)) {
          this.store.update(c.id, c);
        } else {
          this.store.add(c);
        }
      })
    );
  }

  createCase(data: StoreCaseReq) {
    return this.httpClient.post<CaseDetail>(`/support-center/private/v3/cases`, data);
  }

  updateCase(identifier: CaseIdentity, data: Partial<UpdateCaseReq>) {
    return this.httpClient
      .put<CaseDetail>(`/support-center/private/v3/cases/${identifier.ownerOrgUuid}/${identifier.sid}`, data)
      .pipe(
        map(c => new CaseDetail(c)),
        tap(c => this.store.update(identifier.id, c))
      );
  }

  // related case section
  getRelatedCases(identifier: CaseIdentity) {
    return this.httpClient
      .get<RelatedCase[]>(`/support-center/private/v3/cases/${identifier.ownerOrgUuid}/${identifier.sid}/relatedTos`)
      .pipe(
        tap(list => {
          this.store.update(identifier.id, { relatedCases: list });
        })
      );
  }

  updateRelatedCases(
    identifier: CaseIdentity,
    req: {
      action: 'remove' | 'add';
      sid: number;
      orgUuid: string;
    }
  ) {
    return this.httpClient
      .put<RelatedCase[]>(
        `/support-center/private/v3/cases/${identifier.ownerOrgUuid}/${identifier.sid}/relatedTos`,
        req
      )
      .pipe(
        tap(list => {
          this.store.update(identifier.id, () => ({
            relatedCases: list
          }));
        })
      );
  }

  // activity section
  getActivities(identifier: CaseIdentity) {
    return this.httpClient
      .get<CaseActivity[]>(`/support-center/private/v3/cases/${identifier.ownerOrgUuid}/${identifier.sid}/activities`)
      .pipe(
        map(list => list.map(l => new CaseActivity(l))),
        tap(activities => {
          this.store.update(identifier.id, { activities: activities });
        })
      );
  }

  createComment(identifier: CaseIdentity, comment: CreateCaseCommentReq) {
    return this.httpClient
      .post<CaseActivity>(
        `/support-center/private/v3/cases/${identifier.ownerOrgUuid}/${identifier.sid}/comments`,
        comment
      )
      .pipe(
        tap(comment => {
          this.store.update(identifier.id, ({ activities }) => ({
            activities: arrayAdd(activities, comment)
          }));
        })
      );
  }

  updateComment(identifier: CaseIdentity, id: number, comment: CreateCaseCommentReq) {
    return this.httpClient
      .put<CaseActivity>(
        `/support-center/private/v3/cases/${identifier.ownerOrgUuid}/${identifier.sid}/comments/${id}`,
        comment
      )
      .pipe(
        tap(result => {
          this.store.update(identifier.id, ({ activities }) => ({
            activities: arrayUpdate(activities, id, result)
          }));
        })
      );
  }

  deleteComment(identifier: CaseIdentity, activitId: number) {
    return this.httpClient
      .delete<void>(
        `/support-center/private/v3/cases/${identifier.ownerOrgUuid}/${identifier.sid}/comments/${activitId}`
      )
      .pipe(
        tap(() => {
          this.store.update(identifier.id, ({ activities }) => ({
            activities: arrayRemove(activities, activitId)
          }));
        })
      );
  }

  // assignee section
  getAssignees(identifier: CaseIdentity) {
    return this.httpClient
      .get<string[]>(`/support-center/private/v3/cases/${identifier.ownerOrgUuid}/${identifier.sid}/assignees`)
      .pipe(
        tap(result => {
          this.store.update(identifier.id, { assignees: result });
        })
      );
  }

  updateAssignee(identifier: CaseIdentity, action: 'add' | 'remove', identityUuid: string) {
    const body = {
      action: action,
      identityUuid: identityUuid
    };
    return this.httpClient
      .put<AssigneesCase>(
        `/support-center/private/v3/cases/${identifier.ownerOrgUuid}/${identifier.sid}/assignees`,
        body
      )
      .pipe(
        tap(() => {
          if (action === 'add') {
            this.store.update(identifier.id, ({ assignees }) => ({
              assignees: arrayAdd(assignees, identityUuid)
            }));
          } else {
            this.store.update(identifier.id, ({ assignees }) => ({
              assignees: arrayRemove(assignees, identityUuid)
            }));
          }
        })
      );
  }

  getCollaborators(identifier: CaseIdentity) {
    return this.httpClient
      .get<Collaborator[]>(
        `/support-center/private/v3/cases/${identifier.ownerOrgUuid}/${identifier.sid}/collaborators`
      )
      .pipe(
        tap(result => {
          this.store.update(identifier.id, { collaborators: result });
        })
      );
  }

  updateCollaborator(identifier: CaseIdentity, orgUuid: string, action: string) {
    const body = {
      action: action,
      orgUuid: orgUuid
    };
    return this.httpClient
      .put<Collaborator>(
        `/support-center/private/v3/cases/${identifier.ownerOrgUuid}/${identifier.sid}/collaborators`,
        body
      )
      .pipe(
        tap(() => {
          if (action === 'add') {
            this.store.update(identifier.id, ({ collaborators }) => ({
              collaborators: arrayAdd(collaborators, { orgUuid: orgUuid, role: CollaboratorRole.participant })
            }));
          } else {
            this.store.update(identifier.id, ({ collaborators }) => ({
              collaborators: arrayRemove(collaborators, orgUuid, 'orgUuid')
            }));
          }
        })
      );
  }

  getWatchers(identifier: CaseIdentity) {
    return this.httpClient
      .get<string[]>(`/support-center/private/v3/watchers/cases/${identifier.ownerOrgUuid}/${identifier.sid}`)
      .pipe(
        tap(result => {
          this.store.update(identifier.id, { watchers: result });
        })
      );
  }

  watchCase(identifier: CaseIdentity, identityUuid: string) {
    return this.httpClient
      .post(`/support-center/private/v3/watchers/cases/${identifier.ownerOrgUuid}/${identifier.sid}`, null)
      .pipe(
        tap(() => {
          this.store.update(identifier.id, ({ watchers }) => ({
            watchers: arrayAdd(watchers, identityUuid)
          }));
        })
      );
  }

  unwatchCase(identifier: CaseIdentity, identityUuid: string) {
    return this.httpClient
      .delete(`/support-center/private/v3/watchers/cases/${identifier.ownerOrgUuid}/${identifier.sid}`)
      .pipe(
        tap(() => {
          this.store.update(identifier.id, ({ watchers }) => ({
            watchers: arrayRemove(watchers, identityUuid)
          }));
        })
      );
  }

  // store actions
  setActive(id: number) {
    this.store.setActive(id);
  }

  removeActive(id: number) {
    this.store.removeActive(id);
  }

  //TODO should move out case
  getNotificationsCase(pageable?: Pageable) {
    let params = new HttpParams();
    if (pageable) {
      params = params.set('page', String(Number(pageable.page) + 1)).set('perPage', String(pageable.perPage));
    }
    return this.httpClient.get<NotificationsCase>(`/support-center/private/v3/notifications`, { params: params });
  }

  //TODO what type of these params?
  notificationRead(lastUpdated, clickedAll) {
    const body = {
      clickedAll: clickedAll,
      lastUpdated: lastUpdated
    };
    return this.httpClient.post(`/support-center/private/v3/notifications/read`, body);
  }

  notificationUnread() {
    return this.httpClient.get<number>(`/support-center/private/v3/notifications/unread`);
  }

  notificationClicked(clickedAll: boolean, notificationIds: number[], lastUpdated: number) {
    const body = {
      clickedAll: clickedAll,
      notificationIds: notificationIds,
      lastUpdated: lastUpdated
    };
    return this.httpClient.post(`/support-center/private/v3/notifications/clicked`, body);
  }
}
