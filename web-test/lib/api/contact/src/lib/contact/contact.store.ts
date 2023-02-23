import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, EntityUIStore, StoreConfig } from '@datorama/akita';
import { ContactUI, TabTxn } from './contact-ui.model';
import { Contact, ContactFilterBy, ContactsFilterState } from './contact.model';

export interface ContactState extends EntityState<Contact>, ActiveState {
  filter: ContactsFilterState;
  recentContacts: string[];
}

export interface ContactUIState extends EntityState<ContactUI> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'contact_contact', idKey: 'uuid' })
export class ContactStore extends EntityStore<ContactState> {
  override ui: EntityUIStore<ContactUIState>;
  constructor() {
    super({
      filter: { type: ContactFilterBy.ORGANIZATION, keyword: '' },
      recentContacts: []
    });
    this.createUIStore({}, { deepFreezeFn: obj => obj }).setInitialEntityState(<ContactUIState>{
      loaded: false,
      viewingOlderMessage: false,
      livechat: {
        loaded: false,
        hasMore: true
      },
      whatsapp: {
        loaded: false,
        hasMore: true
      },
      selectTab: TabTxn.livechat
    });
  }

  updateUiState(filter: Partial<ContactsFilterState>) {
    this.update(state => ({
      filter: {
        ...state.filter,
        ...filter
      }
    }));
  }
}
