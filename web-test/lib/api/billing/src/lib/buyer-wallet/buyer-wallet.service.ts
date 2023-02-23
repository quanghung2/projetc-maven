import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ID } from '@datorama/akita';
import { tap } from 'rxjs/operators';
import { BuyerWallet } from './buyer-wallet.model';
import { BuyerWalletStore } from './buyer-wallet.store';

@Injectable({ providedIn: 'root' })
export class BuyerWalletService {

  constructor(private buyerWalletStore: BuyerWalletStore, private http: HttpClient) {
  }


  get() {
    return this.http.get<BuyerWallet[]>('https://api.com').pipe(tap(entities => {
      this.buyerWalletStore.set(entities);
    }));
  }

  add(buyerWallet: BuyerWallet) {
    this.buyerWalletStore.add(buyerWallet);
  }

  update(id, buyerWallet: Partial<BuyerWallet>) {
    this.buyerWalletStore.update(id, buyerWallet);
  }

  remove(id: ID) {
    this.buyerWalletStore.remove(id);
  }

}
