import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Wallet } from './wallet';

export interface WalletState {
  wallet: Wallet;
}
function createWalletState() {
  return {} as WalletState;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'billing_wallet' })
export class WalletStore extends Store<WalletState> {
  constructor() {
    super(createWalletState());
  }
}
