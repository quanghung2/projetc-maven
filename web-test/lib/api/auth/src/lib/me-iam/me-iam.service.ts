import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { IAMGrantedPermission, IAMGroup } from '../iam/iam.model';
import { UpdateIAMReq } from '../member/member';
import { MeIamStore } from './me-iam.store';

@Injectable({ providedIn: 'root' })
export class MeIamService {
  constructor(private meIamStore: MeIamStore, private http: HttpClient) {}

  /**
   * Using this method to get granted permission for login user
   */
  get(): Observable<IAMGrantedPermission[]> {
    return this.http.get<IAMGrantedPermission[]>(`auth/private/v1/iam`).pipe(
      map(list => list.map(l => new IAMGrantedPermission(l))),
      tap(permissions => this.meIamStore.set(permissions))
    );
  }

  verifyUser(requestBody: Partial<UpdateIAMReq>): Observable<void> {
    return this.http.post<void>('auth/private/v1/iam/verify', requestBody);
  }

  getAssignedGroup() {
    return this.http.get<IAMGroup[]>(`auth/private/v1/iam/group/self`).pipe(
      map(x => x || []),
      tap(groups => this.meIamStore.update({ iamGroups: groups }))
    );
  }
}
