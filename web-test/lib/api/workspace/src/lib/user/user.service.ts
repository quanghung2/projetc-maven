import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CHAT_PUBLIC_PREFIX } from '@b3networks/shared/common';
import { ID } from '@datorama/akita';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { Integration, IntegrationStatus } from '../integration/integration.model';
import { IntegrationStore } from '../integration/integration.store';
import { MeStore } from './me.store';
import { CallCenterAgent, User, UserStatus, UserStatusResponse, UserUI } from './user.model';
import { UserQuery } from './user.query';
import { UserStore } from './user.store';

export type ChatUserType = 'chatId' | 'identity';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  notFoundUsers: string[] = [];
  private baseURL = `workspace/private/v1/user/`;

  constructor(
    private http: HttpClient,
    private userStore: UserStore,
    private meStore: MeStore,
    private userQuery: UserQuery,
    private integrationStore: IntegrationStore
  ) {}

  getMe(): Observable<User> {
    return this.http.get<User>(`workspace/private/v1/user/me`).pipe(
      map(user => {
        const result = new User(user);
        this.meStore.update({ me: result });
        return result;
      })
    );
  }

  fetchAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`workspace/private/v1/user/all`).pipe(
      map(list => {
        const users = list.map(user => new User(user));
        this.userStore.upsertMany(users, { baseClass: User });
        return users;
      }),
      tap(() => {
        this.userStore.update({ loaded: true });
      })
    );
  }

  fetchAllUsersV2() {
    return this.http.get<User[]>(`workspace2/private/v2/user/all`).pipe(
      map(list => list.map(user => new User({ ...user, identityUuid: user.uuid, isTemporary: true }))),
      tap(users => {
        this.userStore.upsertMany(users, { baseClass: User });
        this.userStore.update({ loaded: true });
      })
    );
  }

  findByUuidAndUserType(userUuids: string[], userType: ChatUserType) {
    const params = { type: userType, uuids: userUuids.join(',') };

    return this.http.get<User[]>('/workspace/private/v1/user/members', { params: params }).pipe(
      map(result => {
        const users: (User | Integration)[] = result.map(u =>
          !u.isBot
            ? new User({ ...u, isTemporary: false } as User)
            : new Integration({
                uuid: u.uuid,
                orgUuid: u.orgUuid,
                msChatUuid: u.userUuid,
                name: u.displayName,
                photoUrl: u.photoUrl,
                status: IntegrationStatus.Active,
                isBot: true
              })
        );
        if (users.length < userUuids.length) {
          for (const userUuid of userUuids) {
            const index = users.findIndex(u =>
              userType === 'chatId'
                ? u instanceof User
                  ? u.userUuid === userUuid
                  : u.msChatUuid === userUuid
                : u instanceof User
                ? u.identityUuid === userUuid
                : u.uuid === userUuid
            );
            if (index === -1) {
              users.push(
                new User({
                  userUuid: userType === 'chatId' ? userUuid : null,
                  identityUuid: userType === 'identity' ? userUuid : null,
                  displayName: 'Unknown Account',
                  memberStatus: 'DELETED'
                })
              );
            }
          }
        }
        return users;
      }),
      tap(
        (users: (User | Integration)[]) => {
          const usersStore = users.filter(x => !x.isBot);
          const integrationsStore = users.filter(x => x.isBot);
          if (usersStore?.length > 0) {
            this.userStore.upsertMany(usersStore as User[], { baseClass: User });
          }
          if (integrationsStore.length > 0) {
            this.integrationStore.upsertMany(integrationsStore as Integration[], { baseClass: Integration });
          }
        },
        _ => (this.notFoundUsers = [...this.notFoundUsers, ...userUuids])
      )
    );
  }

  initUsersStatus() {
    this.http
      .post<{ Status: any }>(`${CHAT_PUBLIC_PREFIX}/status/_all`, null)
      .pipe(
        map((resp: { Status: any }) => {
          const rs = <UserStatusResponse[]>[];
          if (resp.Status) {
            for (const uuid of Object.keys(resp.Status)) {
              rs.push(
                new UserStatusResponse({
                  uuid,
                  state: resp.Status[uuid].state,
                  ts: resp.Status[uuid].ts
                })
              );
            }
          }
          return rs;
        })
      )
      .subscribe(rs => this.updateUserStatus(rs));
  }

  updateWhatsappAgent(identityUuid: string, licence: string) {
    return this.http.put(`/workspace/private/v1/agents/${identityUuid}`, { licence: licence });
  }

  syncWhatsappAgents() {
    return this.http.post('/workspace/private/v1/agents/sync', {});
  }

  updateUserStatus(statuses: UserStatusResponse[]) {
    statuses.forEach(status => {
      this.userStore.update(
        entity =>
          status.uuid === entity.userUuid && (!entity.latestStatusMillis || status.ts > entity.latestStatusMillis),
        {
          status: status.state,
          latestStatusMillis: status.ts
        }
      );
    });
  }

  changeStatusForUser(users: string[], status: UserStatus) {
    this.userStore.update(users, entity => ({
      ...entity,
      status: status
    }));
  }

  activeMember(uuid: string) {
    this.userStore.setActive(uuid);
  }

  removeActive(uuid: ID | string) {
    if (uuid) {
      this.userStore.removeActive(uuid);
    }
  }

  getAgents(): Observable<User[]> {
    this.userStore.setLoading(true);
    return this.http.get<CallCenterAgent[]>(this.baseURL + `agents`).pipe(
      map(agents => {
        return agents.map(
          a =>
            <User>{
              isAgent: true,
              identityUuid: a.identityUuid,
              displayName: a.displayName ? a.displayName : '',
              photoUrl: a.photoUrl,
              role: a.role,
              email: a.email ? a.email : '',
              uuid: a.identityUuid
            }
        );
      }),
      tap(users => {
        this.userStore.upsertMany(users, { baseClass: User });
      }),
      finalize(() => this.userStore.setLoading(false))
    );
  }

  updateAgents(agentIds: string[]) {
    return this.http.put(this.baseURL + `agents`, { agents: agentIds }).pipe(
      map(() => {
        const allUsers = this.userQuery.getAllUsers();
        return allUsers
          .filter(user => agentIds.includes(user.identityUuid))
          .map(user => <User>{ ...user, isAgent: true });
      }),
      tap(addedAgents => {
        this.userStore.upsertMany(addedAgents, { baseClass: User });
      })
    );
  }

  removeAgent(agentUuid: string) {
    return this.http.delete(this.baseURL + `agents/${agentUuid}`).pipe(
      map(() => {
        const allUsers = this.userQuery.getAllUsers();
        return allUsers.filter(user => agentUuid === user.identityUuid).map(user => <User>{ ...user, isAgent: false });
      }),
      tap(removedAgents => {
        this.userStore.upsertMany(removedAgents, { baseClass: User });
      })
    );
  }

  updateUsers2Store(users: User[]) {
    this.userStore.upsertMany(users, { baseClass: User });
  }

  updateUserViewState(uuid: string | string[], state: Partial<UserUI>) {
    this.userStore.ui.update(uuid, entity => ({
      ...entity,
      ...state
    }));
  }
}
