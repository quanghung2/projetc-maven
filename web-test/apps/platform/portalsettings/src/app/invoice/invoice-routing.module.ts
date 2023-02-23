import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreditNoteComponent } from './components/credit-note/credit-note.component';
import { IndividualInvoiceComponent } from './components/individual-invoice/individual-invoice.component';
import { InvoiceSettingsComponent } from './components/invoice-settings/invoice-settings.component';
import { MonthlyInvoiceComponent } from './components/monthly-invoice/monthly-invoice.component';
import { TemplateListComponent } from './components/template-list/template-list.component';
import { InvoiceComponent } from './invoice.component';

const routes: Routes = [
  {
    path: '',
    component: InvoiceComponent,
    children: [
      { path: '', component: InvoiceSettingsComponent },
      { path: 'list', component: TemplateListComponent },
      { path: 'individual', component: IndividualInvoiceComponent },
      { path: 'monthly', component: MonthlyInvoiceComponent },
      { path: 'cn', component: CreditNoteComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoiceRoutingModule {}
