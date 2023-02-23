import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { BundleDetailComponent } from './bundle-detail/bundle-detail.component';
import { ContactSalesComponent } from './contact-sales/contact-sales.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { ProductComponent } from './products.component';
import { SafeHtmlPipe } from './safe-html.pipe';
import { SlideshowModalComponent } from './slideshow-modal/slideshow-modal.component';
import { SlideshowComponent } from './slideshow/slideshow.component';
import { TileCasePipe } from './tile-case.pipe';
import { UsageChargeUnitPipe } from './usage-charge-unit.pipe';
import { UsageChargeComponent } from './usage-charge/usage-charge.component';

const routes: Routes = [
  { path: '', component: ProductComponent },
  { path: 'telcom-rates', component: UsageChargeComponent },
  { path: 'purchase', loadChildren: () => import('@b3networks/portal/shared').then(m => m.PortalSharedPurchaseModule) },
  {
    path: ':name',
    children: [
      { path: '', component: ProductDetailComponent },
      {
        path: 'purchase',
        loadChildren: () => import('@b3networks/portal/shared').then(m => m.PortalSharedPurchaseModule)
      }
    ]
  }
];

@NgModule({
  declarations: [
    ProductComponent,
    BundleDetailComponent,
    ContactSalesComponent,
    ProductDetailComponent,
    PageNotFoundComponent,
    SlideshowModalComponent,
    SlideshowComponent,
    UsageChargeComponent,
    SafeHtmlPipe,
    UsageChargeUnitPipe,
    TileCasePipe
  ],
  exports: [ProductComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedCommonModule, SharedUiMaterialModule, FormsModule]
})
export class ProductsModule {}
