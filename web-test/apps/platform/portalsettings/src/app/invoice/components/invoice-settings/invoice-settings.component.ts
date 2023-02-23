import { Component, OnInit } from '@angular/core';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { RouteService } from '../../../core/services';
import { Counter, CounterService, InvoiceService, Settings } from '../../core';

declare const X;

@Component({
  selector: 'app-invoice-settings',
  templateUrl: './invoice-settings.component.html',
  styleUrls: ['./invoice-settings.component.scss']
})
export class InvoiceSettingsComponent implements OnInit {
  domainSettings = new Settings();
  unsavedDomainSettings = new Settings();
  unsavedInvoiceCounter = new Counter();
  unsavedProformaCounter = new Counter();
  unsavedTaxCounter = new Counter();
  unsavedTopupCounter = new Counter();
  unsavedCreditNoteCounter = new Counter();
  quoteCounter = new Counter();
  unsavedQuoteCounter = new Counter();
  isLoading = false;
  private domain: string;
  private counters: Counter[] = [];

  constructor(
    private routeService: RouteService,
    private counterService: CounterService,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit() {
    this.routeService.domain
      .pipe(
        tap(d => (this.domain = d)),
        switchMap(() => this.invoiceService.getDomainSettings())
      )
      .subscribe(settings => {
        this.domainSettings = settings;
        Object.assign(this.unsavedDomainSettings, settings);
      });

    this.counterService.getQuoteCounter().subscribe(quoteCounter => {
      this.quoteCounter = quoteCounter;
      Object.assign(this.unsavedQuoteCounter, this.quoteCounter);
    });

    this.routeService.domain.pipe(switchMap(d => this.counterService.getInvoiceCounters(d))).subscribe(counters => {
      this.counters = counters;
      counters.forEach(c => {
        if (c.isInvoice()) {
          Object.assign(this.unsavedInvoiceCounter, c);
        } else if (c.isProformaInvoice()) {
          Object.assign(this.unsavedProformaCounter, c);
        } else if (c.isTaxInvoice()) {
          Object.assign(this.unsavedTaxCounter, c);
        } else if (c.isTopupInvoice()) {
          Object.assign(this.unsavedTopupCounter, c);
        } else if (c.isCreditNote()) {
          Object.assign(this.unsavedCreditNoteCounter, c);
        }
      });
    });
  }

  updateInvoiceSetting(): void {
    this.formatInvoiceDomainDueDate();

    this.isLoading = true;
    this.invoiceService
      .updateDomainSettings(this.unsavedDomainSettings)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => null,
        error => X.showWarn(error.json().message)
      );
  }

  updateQuoteCounter() {
    this.unsavedQuoteCounter = this.formatLengthAndCurrentUnSavedObject(this.unsavedQuoteCounter);

    this.isLoading = true;
    this.counterService
      .updateQuoteCounter(this.unsavedQuoteCounter)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => (this.quoteCounter = new Counter(this.unsavedQuoteCounter)),
        error => X.showWarn(error.json().message)
      );
  }

  updateInvoiceCounter(unSaved: Counter): void {
    unSaved = this.formatLengthAndCurrentUnSavedObject(unSaved);

    this.isLoading = true;
    this.counterService
      .updateInvoiceCounter(this.domain, unSaved)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => {
          const currentCounterIndex = this.findCounterIndexByType(unSaved.type);
          this.counters[currentCounterIndex] = unSaved;
        },
        error => X.showWarn(error.json().message)
      );
  }

  private findCounterIndexByType(type: string) {
    return this.counters.findIndex(c => c.type === type);
  }

  private formatLengthAndCurrentUnSavedObject(unSavedObject: Counter): Counter {
    if (!unSavedObject.length || unSavedObject.length < 0) {
      unSavedObject.length = 1;
    }
    if (!unSavedObject.current || unSavedObject.current < 0) {
      unSavedObject.current = 1;
    }
    return unSavedObject;
  }

  private formatInvoiceDomainDueDate(): void {
    if (!this.unsavedDomainSettings.dueDays || this.unsavedDomainSettings.dueDays < 0) {
      this.unsavedDomainSettings.dueDays = 1;
    }
  }
}
