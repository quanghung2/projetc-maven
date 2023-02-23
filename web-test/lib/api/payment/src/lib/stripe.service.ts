import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaymentSettingsService } from './payment-settings.service';

declare const Stripe: any;

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  stripe: any;
  cardNumber: any;
  cardExpiry: any;
  cardCvc: any;

  constructor(private paymentSettingsSevice: PaymentSettingsService) {}

  init(): Observable<any> {
    return this.paymentSettingsSevice.getDomainGatewaySettings('stripe').pipe(
      map(settings => {
        if (settings.publicKey) {
          this.stripe = Stripe(settings.publicKey);
          return true;
        }
        return false;
      })
    );
  }

  initStripeForm(className: string) {
    const elements = this.stripe.elements();

    // Floating labels
    const inputs = document.querySelectorAll(`${className} .input`);
    Array.prototype.forEach.call(inputs, function (input) {
      input.addEventListener('focus', function () {
        input.classList.add('focused');
      });
      input.addEventListener('blur', function () {
        input.classList.remove('focused');
      });
      input.addEventListener('keyup', function () {
        if (!input || !input.value || input.value.length === 0) {
          input.classList.add('empty');
        } else {
          input.classList.remove('empty');
        }
      });
    });

    const elementStyles = {
      base: {
        color: '#32325D',
        fontWeight: 500,
        fontFamily: 'Source Code Pro, Consolas, Menlo, monospace',
        fontSize: '16px',
        fontSmoothing: 'antialiased',

        '::placeholder': {
          color: '#CFD7DF'
        },
        ':-webkit-autofill': {
          color: '#e39f48'
        }
      },
      invalid: {
        color: '#E25950',

        '::placeholder': {
          color: '#FFCCA5'
        }
      },
      complete: {},
      empty: {}
    };

    const elementClasses = {
      focus: 'focused',
      empty: 'empty',
      invalid: 'invalid'
    };

    this.cardNumber = elements.create('cardNumber', {
      classes: elementClasses,
      style: elementStyles
    });
    this.cardNumber.mount(`.${className} #card-number`);

    this.cardExpiry = elements.create('cardExpiry', {
      style: elementStyles,
      classes: elementClasses
    });
    this.cardExpiry.mount(`.${className} #card-expiry`);

    this.cardCvc = elements.create('cardCvc', {
      style: elementStyles,
      classes: elementClasses
    });
    this.cardCvc.mount(`.${className} #card-cvc`);

    const error = document.querySelector(`.${className} .error`);
    const errorMessage = error.querySelector(`.${className} .message`);
    error.classList.remove('visible');

    // Listen for errors from each Element, and show error messages in the UI.
    [this.cardNumber, this.cardExpiry, this.cardCvc].forEach(element => {
      element.on('change', event => {
        if (event.error) {
          errorMessage.textContent = event.error.message;
          error.classList.add('visible');
        } else {
          errorMessage.textContent = '';
          error.classList.remove('visible');
        }
      });
    });
  }

  createStripeCard(): Observable<any> {
    return from(this.stripe.createSource(this.cardNumber, {}));
  }

  create3dsResource(resourceId: string, topupAmount: number, currencyCode: string): Observable<any> {
    const zeroDecimalCurrencies = [
      'BIF',
      'DJF',
      'JPY',
      'KRW',
      'PYG',
      'VND',
      'XAF',
      'XPF',
      'CLP',
      'GNF',
      'KMF',
      'MGA',
      'RWF',
      'VUV',
      'XOF'
    ];

    let amount = topupAmount * 100;
    if (zeroDecimalCurrencies.indexOf(currencyCode.toUpperCase()) > -1) {
      amount = topupAmount;
    }
    amount = Math.round(amount * 1000) / 1000;

    return from(
      this.stripe.createSource({
        type: 'three_d_secure',
        amount: amount,
        currency: currencyCode,
        three_d_secure: {
          card: resourceId
        },
        redirect: {
          return_url: location.origin
        }
      })
    );
  }

  retriveSource(source: any): Observable<any> {
    return from(
      this.stripe.retrieveSource({
        id: source.id,
        client_secret: source.client_secret
      })
    );
  }
}
