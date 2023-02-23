import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { PortalMemberSettingSharedModule } from '../../shared/shared.module';
import { OutgoingRulesComponent } from './outgoing-rules.component';

const routes: Routes = [{ path: '', component: OutgoingRulesComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    FormsModule,
    PortalMemberSettingSharedModule,
    SharedUiPortalModule
  ],
  declarations: [OutgoingRulesComponent]
})
export class OutgoingRulesModule {}
