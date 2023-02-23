import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { CommsCallcenterSharedModule } from '@b3networks/comms/callcenter/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { DefaultSupplierComponent } from './default-supplier/default-supplier.component';
import { MappingReferenceComponent } from './mapping-reference/mapping-reference.component';
import { RoutingComponent } from './routing/routing.component';
import { UpdateRoutingComponent } from './routing/update-routing/update-routing.component';
import { SupplierComponent } from './supplier.component';
import { UpdateSupplierComponent } from './update-supplier/update-supplier.component';

const routes: Route[] = [{ path: '', component: SupplierComponent }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    CommsCallcenterSharedModule,
    FlexLayoutModule,
    SharedUiMaterialModule
  ],
  declarations: [
    SupplierComponent,
    DefaultSupplierComponent,
    RoutingComponent,
    UpdateRoutingComponent,
    MappingReferenceComponent,
    UpdateSupplierComponent
  ]
})
export class SupplierModule {}
