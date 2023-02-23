import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, switchMap, tap } from 'rxjs/operators';
import { HyperpsaceUI } from '../..';
import { Hyperspace, ReqHyperspaceCreate, ReqHyperspaceManagement } from './hyperspace.model';
import { HyperspaceStore } from './hyperspace.store';

@Injectable({
  providedIn: 'root'
})
export class HyperspaceService {
  constructor(private httpClient: HttpClient, private store: HyperspaceStore) {}

  //  ===============  owner role only ==============================
  getHyperspacesByOrg(currentOrg: string) {
    return this.httpClient.get<Hyperspace[]>(`workspace2/private/v1/hyperspaces/all`).pipe(
      map(hyperspaces => hyperspaces?.map(h => new Hyperspace(h).withCurrentOrg(currentOrg))),
      tap(hyperspaces => this.store.upsertMany(hyperspaces, { baseClass: Hyperspace }))
    );
  }

  addOrRemoveMemberToHyperspace(id: string, req: ReqHyperspaceManagement, currentOrg: string) {
    return this.httpClient
      .put(`workspace2/private/v1/hyperspaces/${id}/users`, req)
      .pipe(switchMap(() => this.getHyperspacesByOrg(currentOrg)));
  }

  createHyperspace(orgUuid: string, req: ReqHyperspaceCreate, currentOrg: string) {
    return this.httpClient.post<Hyperspace>(`workspace2/private/v1/hyperspaces/${orgUuid}`, req).pipe(
      map(hyperspace => new Hyperspace(hyperspace).withCurrentOrg(currentOrg)),
      tap(hyperspace => this.store.upsert(hyperspace.id, hyperspace, { baseClass: Hyperspace }))
    );
  }

  acceptHyperspace(id: string, currentOrg: string) {
    return this.httpClient.put<Hyperspace>(`workspace2/private/v1/hyperspaces/${id}`, {}).pipe(
      map(hyperspace => new Hyperspace(hyperspace).withCurrentOrg(currentOrg)),
      tap(hyperspace => this.store.upsert(hyperspace.id, hyperspace, { baseClass: Hyperspace }))
    );
  }

  // rejectHyperspace(id: string) {
  //   return this.httpClient.delete<void>(`workspace2/private/v1/hyperspaces/${id}`, {}).pipe(
  //     tap(() => {
  //       this.store.update(id, {
  //         status: StatusHyperspace.deleted
  //       });
  //     })
  //   );
  // }

  //  ===============  member ====================
  getHyperspacesByMember(currentOrg: string) {
    return this.httpClient.get<Hyperspace[]>(`workspace2/private/v1/hyperspaces`).pipe(
      map(hyperspaces => hyperspaces?.map(h => new Hyperspace(h).withCurrentOrg(currentOrg))),
      tap(hyperspaces => this.store.upsertMany(hyperspaces, { baseClass: Hyperspace }))
    );
  }

  updateHyperspaceViewState(ids: string | string[], state: Partial<HyperpsaceUI>) {
    this.store.ui.update(ids, entity => ({
      ...entity,
      ...state
    }));
  }
}
