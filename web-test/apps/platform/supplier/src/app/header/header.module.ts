import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommsCallcenterSharedModule } from '@b3networks/comms/callcenter/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { DefaultSupplierComponent } from './default-supplier/default-supplier.component';
import { HeaderComponent } from './header.component';

@NgModule({
  imports: [CommsCallcenterSharedModule, LayoutModule, CommonModule, SharedCommonModule, SharedUiMaterialModule],
  declarations: [HeaderComponent, DefaultSupplierComponent],
  exports: [HeaderComponent]
})
export class HeaderModule {}
