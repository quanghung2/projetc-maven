import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HashMap } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DomainLiability } from '../domain-liability';
import { TempCreditLimit } from '../temp-credit-limit';
import { TransferCreditReq } from '../transfer-credit-req';
import { BalanceForBuyer, BuyerWallet } from './buyer-wallet';
import { Wallet } from './wallet';
import { WalletStore } from './wallet.store';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  constructor(private http: HttpClient, private store: WalletStore) {
  }

  getWallet(): Observable<Wallet> {
    return this.http.get<Wallet>(`/billing/private/v4/wallet`).pipe(
      map(res => new Wallet(res)),
      tap(wallet => this.store.update({ wallet: wallet }))
    );
  }

  transferCredit(toWalletUuid: string, transferCreditRequest: TransferCreditReq) {
    return this.http.post(`/billing/private/v2/wallet/credit/transfer/${toWalletUuid}`, transferCreditRequest);
  }

  getTempCreditLimits(): Observable<TempCreditLimit[]> {
    return this.http.get<TempCreditLimit[]>(`/billing/private/v2/temp-credit-limits`);
  }

  getDomainLiable(): Observable<DomainLiability> {
    return this.http.get<DomainLiability>(`/billing/private/admin/liability`);
  }

  getBuyerTag(buyerUuid: string): Observable<HashMap<string>> {
    return this.http.get<HashMap<string>>(`/billing/private/v6/buyerTag/${buyerUuid}`);
  }

  getBuyerWallet(buyerOrgUuid: string): Observable<BuyerWallet[]> {
    return this.http
      .get<BuyerWallet[]>(`/billing/private/v6/buyerWallets/${buyerOrgUuid}`)
      .pipe(map(res => res.map(item => new BuyerWallet(item))));
  }

  getSellerWallet(sellerOrgUuid: string): Observable<BuyerWallet[]> {
    return this.http
      .get<BuyerWallet[]>(`/billing/private/v6/sellerWallets/${sellerOrgUuid}`)
      .pipe(map(res => res.map(item => new BuyerWallet(item))));
  }

  putBuyerTag(buyerUuid: string, req: HashMap<string>): Observable<void> {
    return this.http.put<void>(`/billing/private/v6/buyerTag/${buyerUuid}`, req);
  }

  getBalanceMovementForBuyer(buyerUuid: string, currency: string): Observable<BalanceForBuyer[]> {
    return this.http
      .get<BalanceForBuyer[]>(`/data/private/balanceMovementForBuyer/${buyerUuid}/${currency}`)
      .pipe(map(res => res.map(item => new BalanceForBuyer(item))));
  }

  getBalanceMovementForSeller(sellerUuid: string, currency: string): Observable<BalanceForBuyer[]> {
    return this.http
      .get<BalanceForBuyer[]>(`/data/private/balanceMovementForSeller/${sellerUuid}/${currency}`)
      .pipe(map(res => res.map(item => new BalanceForBuyer(item))));
  }

  updateBuyerWallets(buyerUuid: string, currency: string, postpaid: boolean) {
    const url = `/billing/private/v6/buyerWallets/${buyerUuid}/${currency}`;
    return this.http.put<void>(url, { postpaid: !postpaid });
  }
}
