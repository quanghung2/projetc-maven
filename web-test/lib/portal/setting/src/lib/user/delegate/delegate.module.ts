import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { PortalMemberSettingSharedModule } from '../../shared/shared.module';
import { RingmeFormModule } from '../ringme-form/ringme-form.module';
import { DelegateComponent } from './delegate.component';

const routes: Routes = [{ path: '', component: DelegateComponent }];

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
  declarations: [DelegateComponent]
})
export class DelegateModule {}
