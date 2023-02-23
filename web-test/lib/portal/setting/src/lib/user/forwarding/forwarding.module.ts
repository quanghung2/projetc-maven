import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { PortalMemberSettingSharedModule } from '../../shared/shared.module';
import { RingmeFormModule } from '../ringme-form/ringme-form.module';
import { ForwardingComponent } from './forwarding.component';

const routes: Routes = [{ path: '', component: ForwardingComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    FormsModule,
    PortalMemberSettingSharedModule,
    SharedUiPortalModule,
    RingmeFormModule
  ],
  declarations: [ForwardingComponent]
})
export class ForwardingModule {}
