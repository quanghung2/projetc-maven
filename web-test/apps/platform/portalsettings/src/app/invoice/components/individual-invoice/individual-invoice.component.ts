import { Component, OnInit, ViewChild } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { TinymceDirective } from '../../../common/directive/tinymce.directive';
import { InvoiceService } from '../../core/invoice.service';
import { Template } from '../../core/template.model';
import { TemplateService } from '../../core/template.service';

declare const X;

@Component({
  selector: 'app-individual-invoice',
  templateUrl: './individual-invoice.component.html',
  styleUrls: ['../shared/invoice.css', './individual-invoice.component.scss']
})
export class IndividualInvoiceComponent implements OnInit {
  @ViewChild('dueNoteEditor', { static: true }) dueNoteEditor: TinymceDirective;
  @ViewChild('paidNoteEditor', { static: true }) paidNoteEditor: TinymceDirective;

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
        tap(partnerInfo => (this.supportedCurrencies = partnerInfo.supportedCurrencies)),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(() => this.onCurrencyChanged(this.supportedCurrencies[0]));
  }

  resetChanges() {
    Object.assign(this.unsavedTemplate, this.template);
    this.dueNoteEditor.setContent(this.template.individualUnpaidNote);
    this.paidNoteEditor.setContent(this.template.individualPaidNote);
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

  onDueNoteChanged($event) {
    this.hasChanges = true;
    this.unsavedTemplate.individualUnpaidNote = $event;
  }

  onPaidNoteChanged($event) {
    this.hasChanges = true;
    this.unsavedTemplate.individualPaidNote = $event;
  }

  insertVarIntoDueNote(v) {
    if (this.dueNoteEditor != null) {
      this.dueNoteEditor.insertContent(v);
      this.hasChanges = true;
    }
  }

  insertVarIntoPaidNote(v) {
    if (this.paidNoteEditor != null) {
      this.paidNoteEditor.insertContent(v);
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
        this.dueNoteEditor.setContent(template.individualUnpaidNote);
        this.paidNoteEditor.setContent(template.individualPaidNote);
      });
  }
}
