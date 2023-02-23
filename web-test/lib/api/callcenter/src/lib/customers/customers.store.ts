import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { CustomerChatBox } from './customers.model';

export function createInitialState(): CustomerChatBox {
  return <CustomerChatBox>{
    ui: {
      isLandscape: false,
      isMobile: false,
      isCollapse: false,
      showFooter: false,
      waitingChatbot: false
    }
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'callcenter_customer', idKey: 'uuid' })
export class CustomersStore extends Store<CustomerChatBox> {
  constructor() {
    super(createInitialState());
  }
}
