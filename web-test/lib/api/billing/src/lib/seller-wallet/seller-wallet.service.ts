import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SellerWallet } from './seller-wallet.model';
import { SellerWalletStore } from './seller-wallet.store';

/**
 * Seller wallet is using for node
 * Customer will get list of seller and then fetch all wallets with this sellers
 */
@Injectable({ providedIn: 'root' })
export class SellerWalletService {
  constructor(private sellerWalletStore: SellerWalletStore, private http: HttpClient) {}

  /**
   * Get list sellers of buyer
   */
  getSellers(): Observable<string[]> {
    return this.http.get<string[]>(`billing/private/v6/sellerWallets`).pipe(
      tap(list => {
        this.sellerWalletStore.update({ sellerUuids: list });
      })
    );
  }

  getWallets(sellerUuid: string) {
    return this.http.get<SellerWallet[]>(`billing/private/v6/sellerWallets/${sellerUuid}`).pipe(
      map(list => list.map(wallet => new SellerWallet({ ...wallet, sellerUuid }))),
      tap(entities => {
        if (this.sellerWalletStore.getValue().ids.length) {
          this.sellerWalletStore.upsertMany(entities);
        } else {
          this.sellerWalletStore.set(entities);
        }
      })
    );
  }
}
