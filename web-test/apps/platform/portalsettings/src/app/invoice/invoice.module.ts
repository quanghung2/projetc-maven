import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppCommonModule } from '../common/common.module';
import { CreditNoteComponent } from './components/credit-note/credit-note.component';
import { IndividualInvoiceComponent } from './components/individual-invoice/individual-invoice.component';
import { InvoiceSettingsComponent } from './components/invoice-settings/invoice-settings.component';
import { MonthlyInvoiceComponent } from './components/monthly-invoice/monthly-invoice.component';
import { PreviewInvoiceComponent } from './components/preview-invoice/preview-invoice.component';
import { TemplateListComponent } from './components/template-list/template-list.component';
import { InvoiceRoutingModule } from './invoice-routing.module';
import { InvoiceComponent } from './invoice.component';

@NgModule({
  imports: [CommonModule, FormsModule, AppCommonModule, InvoiceRoutingModule],
  declarations: [
    InvoiceComponent,
    TemplateListComponent,
    MonthlyInvoiceComponent,
    PreviewInvoiceComponent,
    IndividualInvoiceComponent,
    InvoiceSettingsComponent,
    CreditNoteComponent
  ],
  providers: []
})
export class InvoiceModule {}
