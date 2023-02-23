import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiConfirmDialogModule } from '@b3networks/shared/ui/confirm-dialog';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CapacityModalComponent } from '../setting/capacity-modal/capacity-modal.component';
import { CapacityComponent } from '../setting/capacity/capacity.component';
import { CodecModalComponent } from '../setting/codec-modal/codec-modal.component';
import { CodecComponent } from '../setting/codec/codec.component';
import { SettingComponent } from '../setting/setting.component';
import { TranslationModalComponent } from '../setting/translation-modal/translation-modal.component';
import { TranslationComponent } from '../setting/translation/translation.component';
import { HeaderRelayModalComponent } from './header-relay-modal/header-relay-modal.component';
import { HeaderRelayComponent } from './header-relay/header-relay.component';
import { ManipulationModalComponent } from './manipulation-modal/manipulation-modal.component';
import { ManipulationComponent } from './manipulation/manipulation.component';
import { TestTranslationModalComponent } from './test-translation-modal/test-translation-modal.component';

const routes: Route[] = [
  {
    path: '',
    component: SettingComponent
  }
];

@NgModule({
  declarations: [
    SettingComponent,
    CodecComponent,
    CapacityComponent,
    TranslationComponent,
    CodecModalComponent,
    TranslationModalComponent,
    ManipulationComponent,
    CapacityModalComponent,
    TestTranslationModalComponent,
    ManipulationModalComponent,
    HeaderRelayComponent,
    HeaderRelayModalComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    SharedUiConfirmDialogModule,
    SharedCommonModule
  ]
})
export class SettingModule {}
