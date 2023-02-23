import { Injectable } from '@angular/core';
import { EntityUIQuery, Order, QueryEntity } from '@datorama/akita';
import { ContactUI } from './contact-ui.model';
import { Contact, ContactsFilterState } from './contact.model';
import { ContactState, ContactStore, ContactUIState } from './contact.store';

@Injectable({ providedIn: 'root' })
export class ContactQuery extends QueryEntity<ContactState> {
  override ui: EntityUIQuery<ContactUIState>;

  filter$ = this.select(state => state.filter);
  blackList$ = this.select(state => state['blacklist']);
  whiteList$ = this.select(state => state['whitelist']);

  contacts$ = this.selectAll({
    sortBy: 'displayName',
    sortByOrder: Order.ASC
  });

  constructor(protected override store: ContactStore) {
    super(store);
    this.createUIQuery();
  }

  selectUIState<K extends keyof ContactUI>(contactUuid: string, property: K) {
    return this.ui.selectEntity(contactUuid, property);
  }

  getUiState(contactUuid: string) {
    return this.ui.getEntity(contactUuid);
  }

  getFilterState(): ContactsFilterState {
    return this.getValue().filter;
  }

  getRecentContacts() {
    const recent = [...this.getValue()?.recentContacts] || [];
    const contacts: Contact[] = [];
    const activeId = this.getActiveId();
    for (let i = 0; i < recent?.length; i++) {
      const item = this.getEntity(recent[i]);
      if (item && item.uuid !== activeId) {
        contacts.push(item);
      }
    }
    return contacts;
  }

  getContactByChatCustomerId(chatCustomerId: string) {
    const find = this.getAll({
      filterBy: entity => !!entity.chatCustomerId && entity.chatCustomerId === chatCustomerId,
      limitTo: 1
    });
    return find?.length > 0 ? find[0] : null;
  }

  searchContact(query: string) {
    return this.getAll({
      filterBy: contact =>
        contact.fullName.toLowerCase().includes(query) || contact.numbers?.toString().includes(query),
      sortBy: 'displayName',
      sortByOrder: Order.ASC
    });
  }

  selectContactByName(searchValue: string) {
    searchValue = searchValue.toLowerCase();
    return this.selectAll({
      filterBy: entity =>
        entity.displayName?.toLowerCase().indexOf(searchValue) >= 0 ||
        entity?.numbers?.some(x => x.number.includes(searchValue))
    });
  }

  selectTabTxnByContact(contactUuid: string) {
    return this.ui.selectEntity(contactUuid, 'selectTab');
  }
}
