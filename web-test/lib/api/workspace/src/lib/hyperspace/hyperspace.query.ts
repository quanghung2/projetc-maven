import { Injectable } from '@angular/core';
import { EntityUIQuery, Order, QueryEntity } from '@datorama/akita';
import Fuse from 'fuse.js';
import { map } from 'rxjs/operators';
import { HyperpsaceUI } from '../..';
import { Hyperspace, StatusHyperspace } from './hyperspace.model';
import { HyperspaceState, HyperspaceStore, HyperspaceUIState } from './hyperspace.store';

const DEFAULT_SIZE = 20;
const DEFAULT_THRESHOLD = 0.1;

@Injectable({ providedIn: 'root' })
export class HyperspaceQuery extends QueryEntity<HyperspaceState> {
  override ui: EntityUIQuery<HyperspaceUIState>;

  constructor(protected override store: HyperspaceStore) {
    super(store);
    this.createUIQuery();
  }

  selectPropertyHyperspace<K extends keyof Hyperspace>(id: string, property: K) {
    return this.selectEntity(id, property);
  }

  selectUI(id: string) {
    return this.ui.selectEntity(id);
  }

  selectUIState<K extends keyof HyperpsaceUI>(id: string, property: K) {
    return this.ui.selectEntity(id, property);
  }

  getUIState<K extends keyof HyperpsaceUI>(id: string, property: K) {
    const ui = this.ui.getEntity(id);
    return ui ? ui[property] : null;
  }

  selectAllHyperspaces() {
    return this.selectAll({
      sortBy: 'createdAt',
      sortByOrder: Order.DESC
    });
  }

  selectHyperspaceByFilter(search: string, status: StatusHyperspace) {
    search = search?.trim()?.toUpperCase() || '';
    return this.selectAll({
      filterBy: entity =>
        (status === StatusHyperspace.all || entity.status === status) &&
        (!search ||
          entity.otherOrg?.uuid?.toUpperCase().includes(search) ||
          entity.otherOrg.name?.toUpperCase().includes(search)),
      sortBy: 'createdAt',
      sortByOrder: Order.DESC
    });
  }

  selectHyperByHyperspaceId(hyperspaceId: string) {
    return this.selectAll({
      filterBy: entity => entity.hyperspaceId === hyperspaceId,
      limitTo: 1
    }).pipe(map(x => x[0]));
  }

  getHyperByHyperspaceId(hyperspaceId: string) {
    return this.getAll({
      filterBy: entity => entity.hyperspaceId === hyperspaceId,
      limitTo: 1
    })[0];
  }

  selectHyperspaceByUser(identityUuid: string) {
    return this.selectAll({
      filterBy: entity =>
        entity.status === StatusHyperspace.active && entity.currentOrg.users?.some(u => u.identityUuid === identityUuid)
    });
  }

  selectHasHyperspacesByUser(identityUuid: string) {
    return this.selectCount(
      entity =>
        entity.status === StatusHyperspace.active && entity.currentOrg.users?.some(u => u.identityUuid === identityUuid)
    ).pipe(map(count => count > 0));
  }

  searchUsersInsideHyperspace(id: string, search: string) {
    search = search?.trim()?.toUpperCase();
    return this.selectEntity(id, entity =>
      search
        ? entity.currentOrg?.users.filter(x => x.displayName?.toUpperCase().includes(search))
        : entity.currentOrg?.users
    );
  }

  getAllUsersContains(id: string, key: string, limit: number = DEFAULT_SIZE, optionConfig?: any) {
    const hyper = this.getEntity(id);
    if (!hyper) {
      return [];
    }

    const list = hyper.allMembers?.sort((a, b) => a?.displayName?.localeCompare(b?.displayName)) || [];

    let options = {
      keys: ['displayName'],
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
}
