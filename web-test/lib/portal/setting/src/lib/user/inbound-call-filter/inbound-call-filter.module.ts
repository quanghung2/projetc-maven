import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { AddEditDialogComponent } from './add-edit-dialog/add-edit-dialog.component';
import { InboundCallFilterComponent } from './inbound-call-filter.component';

const routes = [{ path: '', component: InboundCallFilterComponent }];

@NgModule({
  declarations: [InboundCallFilterComponent, AddEditDialogComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FlexLayoutModule,
    SharedUiMaterialModule,
    FormsModule,
    SharedCommonModule,
    SharedUiPortalModule
  ]
})
export class InboundCallFilterModule {}
