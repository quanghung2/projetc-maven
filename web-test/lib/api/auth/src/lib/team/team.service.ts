import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { arrayAdd, arrayRemove, cacheable, ID } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PolicyDocument } from '../organization-policy/policty-document.model';
import { Team, TeamMember } from './team.model';
import { TeamStore } from './team.store';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  constructor(private http: HttpClient, private store: TeamStore) {}

  /**
   * ADMIN API for team management only
   * @param orgUuid
   */
  getTeams(orgUuid: string, addon?: { forceLoad: boolean }) {
    const req$ = this.http.get<Team[]>(`/auth/private/v1/organizations/${orgUuid}/teams`).pipe(
      tap(res => {
        if (this.store.getValue().ids.length) {
          this.store.add(res);
        } else {
          this.store.set(res);
        }

        this.store.update(state => {
          const data = { ...state.loadedOrgs };
          data[orgUuid] = true;
          return { loadedOrgs: data };
        });
      })
    );

    if (addon?.forceLoad || !this.store.getValue().loadedOrgs[orgUuid]) {
      return req$;
    } else {
      return cacheable(this.store, req$);
    }
  }

  createTeam(orgUuid: string, name: string) {
    return this.http
      .post<Team>(`/auth/private/v1/organizations/${orgUuid}/teams`, {
        name: name
      })
      .pipe(
        tap((team: Team) => {
          if (team) {
            this.store.add(team);
          }
        })
      );
  }

  updateTeam(orgUuid: string, teamUuid: string, body: Partial<Team>) {
    return this.http.put(`/auth/private/v1/organizations/${orgUuid}/teams/${teamUuid}`, body).pipe(
      tap(() => {
        this.store.update(teamUuid, { ...body });
      })
    );
  }

  getTeamMember(orgUuid: string, teamUuid: string) {
    return this.http.get<TeamMember[]>(`/auth/private/v1/organizations/${orgUuid}/teams/${teamUuid}/members`).pipe(
      tap(newMembers => {
        this.store.update(teamUuid, ({ members }) => ({
          members: arrayAdd(members, newMembers)
        }));
      })
    );
  }

  addMembers(orgUuid: string, teamUuid: string, identityUuids: string[]) {
    return this.http.post<void>(`/auth/private/v1/organizations/${orgUuid}/teams/${teamUuid}/members`, {
      identityUuids
    });
  }

  deleteMember(orgUuid: string, teamUuid: string, memberUuid: string) {
    return this.http
      .delete<void>(`/auth/private/v1/organizations/${orgUuid}/teams/${teamUuid}/members/${memberUuid}`)
      .pipe(
        tap(_ => {
          this.store.update(teamUuid, ({ members }) => ({
            members: arrayRemove(members, memberUuid)
          }));
        })
      );
  }

  getPolicyDocument(orgUuid: string, teamUuid: string): Observable<PolicyDocument> {
    return this.http.get<PolicyDocument>(`auth/private/v2/organizations/${orgUuid}/iam/teams/${teamUuid}`).pipe(
      map(policy => new PolicyDocument(policy)),
      map(policy => {
        const policyResources = policy.policies.reduce((prev, curr) => {
          const key = `${curr.service}_${curr.action}`;
          prev[key] = prev[key] || curr;

          prev[key].resources = [...new Set([...prev[key].resources, ...curr.resources])];

          if (prev[key].resources.includes('*')) {
            prev[key].resources = ['*'];
          }
          return prev;
        }, {});

        policy.policies = Object.values(policyResources);
        return policy;
      }),
      tap(policy => this.store.update(teamUuid, { policyDocument: policy }))
    );
  }

  updatePolicyDocument(orgUuid: string, teamUuid: string, body: PolicyDocument): Observable<PolicyDocument> {
    return this.http
      .put<PolicyDocument>(`/auth/private/v1/organizations/${orgUuid}/iam/teams/${teamUuid}`, body)
      .pipe(tap(resp => this.store.update(teamUuid, { policyDocument: resp })));
  }

  /**
   * @param orgUuid
   * @param adminID: when admin identity is null, API will take the session-token
   */
  getTeamsManagedByAdmin(orgUuid: string, adminID?: string): Observable<Team[]> {
    let params = new HttpParams();
    params = adminID ? params.set('identityUuid', adminID) : params;
    return this.http.get<Team[]>(`/auth/private/v1/organizations/${orgUuid}/teams/admins`, { params }).pipe(
      tap(teams => {
        teams.forEach(t => (t.admins = [adminID]));
        this.store.upsertMany(teams);
      })
    );
  }

  assignAdminForTeam(orgUuid: string, teamUuid: string, adminUuid: string) {
    return this.http
      .post<void>(`/auth/private/v1/organizations/${orgUuid}/teams/${teamUuid}/admins`, {
        identityUuid: adminUuid
      })
      .pipe(
        tap(_ => {
          this.store.update(teamUuid, ({ admins }) => ({
            admins: arrayAdd(admins, adminUuid)
          }));
        })
      );
  }

  deleteAdminForTeam(orgUuid: string, teamUuid: string, adminUuid: string) {
    return this.http
      .delete<void>(`/auth/private/v1/organizations/${orgUuid}/teams/${teamUuid}/admins/${adminUuid}`)
      .pipe(
        tap(_ => {
          this.store.update(teamUuid, ({ admins }) => ({
            admins: arrayRemove(admins, adminUuid)
          }));
        })
      );
  }

  setActiveTeam(team: Team) {
    this.store.setActive(team.uuid);
  }

  removeActiveTeam(id: ID) {
    if (id) {
      this.store.removeActive(id);
    }
  }
}
