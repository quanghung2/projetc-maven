import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AuthenticationDetailComponent } from './authentication-flow/authentication-detail/authentication-detail.component';
import { AuthenticationFlowComponent } from './authentication-flow/authentication-flow.component';
import { CrmIntegrationComponent } from './crm-integration/crm-integration.component';
import { GeneralConfigComponent } from './general-config/general-config.component';
import { SettingComponent } from './setting.component';
import { WorktimeComponent } from './worktime/worktime.component';

const routes: Route[] = [{ path: '', component: SettingComponent }];

@NgModule({
  declarations: [
    SettingComponent,
    GeneralConfigComponent,
    CrmIntegrationComponent,
    AuthenticationDetailComponent,
    AuthenticationFlowComponent,
    WorktimeComponent
  ],
  imports: [CommonModule, RouterModule.forChild(routes), FormsModule, ReactiveFormsModule, SharedUiMaterialModule]
})
export class SettingModule {}
