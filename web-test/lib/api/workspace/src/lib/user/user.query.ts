import { Injectable } from '@angular/core';
import { EntityUIQuery, Order, QueryEntity } from '@datorama/akita';
import Fuse from 'fuse.js';
import { UserUI } from './user.model';
import { UserState, UserStore, UserUIState } from './user.store';

const DEFAULT_SIZE = 5;
const DEFAULT_THRESHOLD = 0.1;

@Injectable({ providedIn: 'root' })
export class UserQuery extends QueryEntity<UserState> {
  override ui: EntityUIQuery<UserUIState>;

  users$ = this.selectAll();
  loading$ = this.selectLoading();

  constructor(protected override store: UserStore) {
    super(store);
    this.createUIQuery();
  }

  getUiState(uuid: string) {
    return this.ui.getEntity(uuid);
  }

  selectUIState<K extends keyof UserUI>(id: string, property: K) {
    return this.ui.selectEntity(id, property);
  }

  storeLoaded() {
    return this.store.getValue()?.loaded;
  }

  selectStoreLoaded() {
    return this.select('loaded');
  }

  getAllUsers(limit?: number) {
    if (limit) {
      return this.getAll({
        filterBy: user => user.memberStatus === 'ACTIVE',
        limitTo: limit,
        sortBy: 'displayName',
        sortByOrder: Order.ASC
      });
    }

    return this.getAll({
      filterBy: user => user.memberStatus === 'ACTIVE',
      sortBy: 'displayName',
      sortByOrder: Order.ASC
    });
  }

  getAllUsersContains(key: string, limit: number = DEFAULT_SIZE, optionConfig?: any) {
    const list = this.getAll({
      filterBy: user => user.memberStatus === 'ACTIVE',
      sortBy: 'displayName',
      sortByOrder: Order.ASC
    });

    let options = {
      keys: ['displayName', 'email', 'mobileNumber'],
      threshold: DEFAULT_THRESHOLD
    };

    if (optionConfig) {
      options = optionConfig;
    }

    const fuse = new Fuse(list, options);

    if (key) {
      const data = fuse.search(key).map(r => r.item);
      return limit < 0 ? data : data.slice(0, limit);
    }
    return limit < 0 ? list : list.slice(0, limit);
  }

  getUserByUuid(uuid: string) {
    return this.getEntity(uuid);
  }

  getAllUserByChatUuid(chatUuid: string | string[]) {
    return this.getAll({
      filterBy: user =>
        typeof chatUuid === 'string' ? user.userUuid === chatUuid : chatUuid.indexOf(user.userUuid) > -1
    });
  }

  getAllUserByIdentityIds(identityId: string[]) {
    return this.getAll({
      filterBy: user => identityId.indexOf(user.identityUuid) > -1
    });
  }

  selectAllUserByIdentityIds(identityId: string[]) {
    return this.selectAll({
      filterBy: user => identityId.indexOf(user.identityUuid) > -1
    });
  }

  getUserByChatUuid(chatUuid: string) {
    const users = this.getAll({ filterBy: user => user.userUuid === chatUuid, limitTo: 1 });
    return users.length > 0 ? users[0] : null;
  }

  selectUserByChatUuid(chatUuid: string) {
    return this.selectEntity(e => e.userUuid === chatUuid);
  }

  selectUserByUuid(uuid: string) {
    return this.selectEntity(e => e.uuid === uuid);
  }

  selectAllAgents() {
    return this.selectAll({
      filterBy: user => user.isAgent,
      sortBy: 'displayName'
    });
  }

  getAgents() {
    return this.getAll({
      filterBy: user => user.isAgent
    });
  }

  getAgentByUuid(uuid: string) {
    return this.getAll({
      filterBy: user => user.identityUuid === uuid && user.isAgent
    });
  }

  selectUserByName(searchValue: string, limit?: number, ignoreList: string[] = []) {
    return this.selectAll({
      filterBy: entity =>
        entity.displayName?.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0 &&
        !ignoreList.includes(entity.userUuid),
      limitTo: limit
    });
  }
}
