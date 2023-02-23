import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IdentityProfileQuery, MemberRole } from '@b3networks/api/auth';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AgentStatus, SystemStatusCode } from '../agent/agent-config';
import { LicenceType } from '../licence/licence';
import { Me } from './me.model';
import { MeStore } from './me.store';

@Injectable({ providedIn: 'root' })
export class MeService {
  constructor(private meStore: MeStore, private http: HttpClient, private profileQuery: IdentityProfileQuery) {}

  /**
   *
   * @param checkExtension want to get with normal extension
   * @returns
   */
  get(checkExtension?: boolean) {
    let params = new HttpParams();

    if (checkExtension) {
      params = params.set('includeExtension', 'true');
    }

    return this.http
      .get<Me>('callcenter/private/v2/agents/me', { params })
      .pipe(
        catchError(error => {
          if (this.profileQuery.currentOrg?.role === MemberRole.SUPER_ADMIN) {
            const profile = this.profileQuery.getProfile();
            return of(<Me>{
              identityUuid: profile.uuid,
              extKey: '000',
              extLabel: profile.displayName,
              licence: LicenceType.supervisor,
              status: AgentStatus.available,
              systemStatus: SystemStatusCode.free,
              statusDuration: 0,
              role: MemberRole.SUPER_ADMIN
            });
          } else {
            this.meStore.update({ isPermission: false });
            return throwError(error);
          }
        }),
        map(me => {
          if (me != null && !me.identityUuid) {
            //fallback for unassigned license but still get ext info
            return null;
          } else {
            return new Me(me);
          }
        }),
        tap(me => {
          this.meStore.update({ me: me, isPermission: !!me?.extKey });
        })
      );
  }

  login(ip: string): Observable<Me> {
    return this.http
      .put<Me>('callcenter/private/v2/agents/me/login', {
        loginIp: ip
      })
      .pipe(
        map(me => new Me(me)),
        tap(me => {
          this.meStore.update({ me: me });
        })
      );
  }

  makeBusy(reason: string): Observable<Me> {
    return this.http
      .put<Me>('callcenter/private/v2/agents/me/busy', {
        reason: reason
      })
      .pipe(
        map(me => new Me(me)),
        tap(me => {
          this.meStore.update({ me: me });
        })
      );
  }

  logout(): Observable<Me> {
    return this.http.put<Me>('callcenter/private/v2/agents/me/logout', {}).pipe(
      map(me => new Me(me)),
      tap(me => {
        this.meStore.update({ me: me });
      })
    );
  }

  dnd() {
    return this.http.put<Me>('callcenter/private/v2/agents/me/dnd', {}).pipe(
      map(me => new Me(me)),
      tap(me => {
        this.meStore.update({ me: me });
      })
    );
  }
}
