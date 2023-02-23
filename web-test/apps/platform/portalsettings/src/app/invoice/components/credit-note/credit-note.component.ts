import { Component, OnInit, ViewChild } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { TinymceDirective } from '../../../common/directive/tinymce.directive';
import { InvoiceService } from '../../core/invoice.service';
import { Template } from '../../core/template.model';
import { TemplateService } from '../../core/template.service';

declare const X;

@Component({
  selector: 'app-credit-note',
  templateUrl: './credit-note.component.html',
  styleUrls: ['./credit-note.component.scss']
})
export class CreditNoteComponent implements OnInit {
  @ViewChild('creditNoteEditor', { static: true }) creditNoteEditor: TinymceDirective;

  PredefinedVar = {
    CUSTOMER_WALLET: '[[${CUSTOMER_WALLET}]]',
    INVOICE_NUMBER: '[[${INVOICE_NUMBER}]]'
  };

  isLoading = false;
  hasChanges = false;
  currency = '';
  supportedCurrencies = new Array<string>();
  template = new Template();
  unsavedTemplate = new Template();

  constructor(private templateService: TemplateService, private invoiceService: InvoiceService) {}

  ngOnInit() {
    this.isLoading = true;

    this.invoiceService
      .getPartnerInfo()
      .pipe(
        tap(pi => (this.supportedCurrencies = pi.supportedCurrencies)),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(() => this.onCurrencyChanged(this.supportedCurrencies[0]));
  }

  resetChanges() {
    Object.assign(this.unsavedTemplate, this.template);
    this.creditNoteEditor.setContent(this.template.creditNote);
    this.hasChanges = false;
  }

  saveChanges() {
    this.isLoading = true;
    this.templateService
      .updateTemplate(this.unsavedTemplate)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(() => {
        this.hasChanges = false;
        Object.assign(this.template, this.unsavedTemplate);
        X.showSuccess('Invoice template has been updated successfully.');
      });
  }

  onCreditNoteChanged($event) {
    this.hasChanges = true;
    this.unsavedTemplate.creditNote = $event;
  }

  insertVarIntoCreditNote(v) {
    if (this.creditNoteEditor != null) {
      this.creditNoteEditor.insertContent(v);
      this.hasChanges = true;
    }
  }

  onCurrencyChanged(currency) {
    this.currency = currency;
    this.isLoading = true;
    this.templateService
      .getTemplate(this.currency)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(template => {
        Object.assign(this.template, template);
        Object.assign(this.unsavedTemplate, template);
        this.creditNoteEditor.setContent(template.creditNote);
      });
  }
}
