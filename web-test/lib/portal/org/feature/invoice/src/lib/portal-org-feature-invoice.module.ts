import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { InvoicesActionBarComponent } from './action-bar/action-bar.component';
import { InvoicesComponent } from './invoices/invoices.component';

const routes: Route[] = [{ path: '', component: InvoicesComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), FormsModule, ReactiveFormsModule, SharedUiMaterialModule],
  declarations: [InvoicesComponent, InvoicesActionBarComponent]
})
export class PortalOrgFeatureInvoiceModule {}
