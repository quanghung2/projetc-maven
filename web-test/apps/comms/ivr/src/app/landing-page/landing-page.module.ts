import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SharedUiLoadingSpinnerModule } from '@b3networks/shared/ui/loading-spinner';
import { LandingPageComponent } from './landing-page.component';
import { PurchaseNumberComponent } from './purchase-number/purchase-number.component';

@NgModule({
  declarations: [LandingPageComponent, PurchaseNumberComponent],
  imports: [
    CommonModule,
    SharedUiLoadingSpinnerModule,
    FlexLayoutModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  exports: [PurchaseNumberComponent]
})
export class LandingPageModule {}
