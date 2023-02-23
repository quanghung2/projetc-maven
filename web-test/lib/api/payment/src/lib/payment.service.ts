import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AutoTopupSetting } from './auto-topup-setting';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpClient) {}

  getAutoTopupSettings(): Observable<AutoTopupSetting> {
    return this.http
      .get<AutoTopupSetting>(`/payment/private/v2/settings/auto-topup`)
      .pipe(map(res => new AutoTopupSetting(res)));
  }

  getGateways(action: string): Observable<Gateway[]> {
    return this.http
      .get<Gateway[]>(`/payment/private/v2/gateways`, {
        params: { action: action }
      })
      .pipe(map(res => res.map(g => new Gateway(g))));
  }

  getStripeInfo() {
    return this.http.get<StripeGateway>(`payment/private/v3/stripe`);
  }

  getStripeInfoV4(sellerUuid: string, currency: string) {
    return this.http.get<StripeInfo>(`payment/private/v4/stripe`, {
      params: { sellerUuid: sellerUuid, currency: currency }
    });
  }

  getSettings(): Observable<AutoTopupSetting> {
    return this.http
      .get<AutoTopupSetting>(`/payment/private/v2/settings/auto-topup`, {})
      .pipe(map(res => Object.assign(new AutoTopupSetting(), res)));
  }

  getStripeCards(): Observable<StoredCard[]> {
    let params: HttpParams = new HttpParams();
    params = params.set('gateway', 'stripe');
    return this.http
      .get<StoredCard[]>(`/payment/private/v2/cards`, { params: params })
      .pipe(map(res => res.map(g => Object.assign(new StoredCard(), g))));
  }

  getStoredCards(gateway: string): Observable<StoredCard[]> {
    let params: HttpParams = new HttpParams();
    params = params.set('gateway', gateway);
    return this.http
      .get<StoredCard[]>(`/payment/private/v2/cards`, { params: params })
      .pipe(map(res => res.map(g => Object.assign(new StoredCard(), g))));
  }

  removeCards(gatewayCode: string) {
    return this.http.delete(`/payment/private/v2/settings/stored-payments/${gatewayCode}`);
  }

  topupWithoutLimitation(topupRequest: TopupWithoutLimitationRequest): Observable<Payment> {
    return this.http
      .post<Payment>(`/payment/private/v2/payments/topup`, topupRequest)
      .pipe(map(data => Object.assign(new Payment(), data)));
  }

  stripeTopupAndStoreCard(topupRequest: StripTopupAndStoreRequest): Observable<Payment> {
    return this.http
      .post<Payment>(`/payment/private/v3/stripe/topupAndStore`, topupRequest)
      .pipe(map(data => Object.assign(new Payment(), data)));
  }

  createPaymentIntent(payload: CreatePaymentIntentReq) {
    return this.http.post<CreatePaymentIntentRes>(`/payment/private/v4/stripe/intent`, payload);
  }

  setAutoTopup(requestParams: UpdateAutoTopupRequest): Observable<AutoTopupSetting> {
    return this.http
      .put<AutoTopupSetting>(`/payment/private/v2/settings/auto-topup`, requestParams)
      .pipe(map(data => Object.assign(new AutoTopupSetting(), data)));
  }

  makeDefaultCard(gatewayCode: string) {
    return this.http
      .post<AutoTopupSetting>(`/payment/private/v2/gateways/${gatewayCode}/make-default`, {})
      .pipe(map(data => Object.assign(new AutoTopupSetting(), data)));
  }

  getPaymentTransaction(req: GetPaymentTxnReq, pageable?: Pageable): Observable<Page<Payment>> {
    const params = new HttpParams()
      .set('status', req.status)
      .set('from', req.from)
      .set('to', req.to)
      .set('page', String(pageable.page))
      .set('perPage', String(pageable.perPage));
    return this.http
      .get<Payment[]>(`/payment/private/v2/payments`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(list => {
          const result = new Page<Payment>();
          result.totalCount = +list.headers.get('x-pagination-total-count');
          result.content = list.body.map(item => new Payment(item));
          return result;
        })
      );
  }

  getStatusAutoTopUpSubscription(buyerUuid: string): Observable<StatusAutoTopUpSubscription> {
    return this.http.get<StatusAutoTopUpSubscription>(`/payment/private/v1/orgConfig/${buyerUuid}`);
  }
}

export class GatewaySetting {
  threshold: number;
  supportNewUser: boolean;
  isOfflineGateway: boolean;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export class Gateway {
  code: string;
  description: string;
  stored: boolean;
  minimumAmount: number;
  adminFeeThreshold: number;
  settings: GatewaySetting;

  constructor(obj?: any) {
    Object.assign(this, obj);
    if (obj) {
      this.settings = new GatewaySetting(obj.settings);
    }
  }

  get isOnlineGateway() {
    return !this.settings.isOfflineGateway;
  }

  get isOfflineGateway() {
    return this.settings.isOfflineGateway;
  }

  get isStripe() {
    return this.code === 'stripe';
  }

  need2ChargeAdminFee(amount: number) {
    return this.adminFeeThreshold && amount < this.adminFeeThreshold;
  }
}

export interface AdminFee {
  currency: string;
  amount: number;
  threshold: number;
}

export interface StripeGateway {
  hasStored: boolean;
  autoTopup?: boolean;
  subscriptionRenewalEnabled: boolean;
  adminFee: AdminFee;
}

export interface StripeAutoTopup {
  currency: string;
  amount: number;
  threshold: number;
}

export interface StripeAdminFee {
  currency: string;
  amount: number;
  threshold: number;
}

export interface StripeInfo {
  last4: string;
  expiry: string;
  adminFee?: StripeAdminFee | null;
  autoToup?: StripeAutoTopup | null;
  paymentMethod: string;
  subscriptionRenewalEnabled: boolean;
}

export class StoredCard {
  id: string;
  brand: string;
  expMonth: number;
  expYear: number;
  last4: string;
  threeDSecure: string; // {required, optional, not_supported}
  cardholder: string;

  get last2ExpYear() {
    return this.expYear.toString().substring(2);
  }

  get brandLogo() {
    let imageURL: string;
    switch (this.brand.toLowerCase()) {
      case 'visa':
        imageURL = 'https://uikit.b3networks.com/libs/icon-branding/card-name-visa.svg';
        break;
      case 'american express':
        imageURL = 'https://uikit.b3networks.com/libs/icon-branding/card-name-american-exp.svg';
        break;
      case 'mastercard':
        imageURL = 'https://uikit.b3networks.com/libs/icon-branding/card-name-master.svg';
        break;
    }
    return imageURL;
  }

  constructor(obj?: Partial<StoredCard>) {
    Object.assign(this, obj);
  }
}

export class StoredCardModel {
  defaultGatewayName: string;
  gateways: GatewayInfo[] = [];
}

export class GatewayInfo {
  name: string;
  isStripe: boolean;
  stripeCard: StripeInfo;

  constructor(parameters?: GatewayInfo) {
    if (parameters) {
      this.name = parameters.name;
      this.isStripe = parameters.isStripe;
      this.stripeCard = parameters.stripeCard;
    }
  }
}

export class TopupGateway {
  code: string; // "stripe|paypal|worldpay"
  mode: string; // "AUTO|STORE|OTP",
  token: string; // stripe card id
}

export class TopupWithoutLimitationRequest {
  amount: number;
  gateway: TopupGateway;
  autoTopup?: boolean;
  remark: string; // transaction description
}

export interface StripTopupAndStoreRequest {
  sourceId: string;
  currency: string;
  amount: number;
  enableAutoTopup?: boolean;
}

export interface CreatePaymentIntentReq {
  currency: string;
  amount: number;
  enableAutoTopup?: boolean;
  sellerUuid: string;
}

export interface CreatePaymentIntentRes {
  clientSecret: string;
}

export interface UpdateAutoTopupRequest {
  enable: boolean;
  renewalSubscription: boolean;
}

export class Payment {
  id: string;
  orgUuid: string;
  walletUuid: string;
  amount: string;
  gateway: TopupGateway;
  failedReason: string;
  invoiceNumber: string;
  status: string;

  constructor(obj?: Partial<Payment>) {
    Object.assign(this, obj);
  }
}

export interface GetPaymentTxnReq {
  status: string;
  from: string;
  to: string;
}

export interface StatusAutoTopUpSubscription {
  blockAutotopupForSubscription: boolean;
}
