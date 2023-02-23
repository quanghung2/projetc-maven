import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CustomerChatBox,
  ResponseTxn,
  ResquestCreateChatSession,
  ResquestCreateTxn,
  UIConfig
} from './customers.model';
import { CustomersStore } from './customers.store';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  static URL_CREATE_TXN = 'callcenter/public/v2/chat/txn';

  constructor(private http: HttpClient, private store: CustomersStore) {}

  createTxn(req: ResquestCreateTxn) {
    return this.http.post<ResponseTxn>(`${CustomersService.URL_CREATE_TXN}`, req);
  }

  createTxnV2(req: ResquestCreateChatSession) {
    return this.http.post<ResponseTxn>(`inbox/public/v2/livechat/_create`, req);
  }

  updateCustomersInfo(customer: CustomerChatBox) {
    this.store.update(customer);
  }

  updateFlow(answers: string[]) {
    this.store.update({
      answers: answers
    });
  }

  updateUI(ui: UIConfig) {
    this.store.update(entity => ({
      ...entity,
      ui: {
        ...entity.ui,
        ...ui
      }
    }));
  }

  resetUIState() {
    const ui = <UIConfig>{
      showFooter: false,
      waitingChatbot: false
    };
    this.updateUI(ui);
  }
}
