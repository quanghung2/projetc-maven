import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedUiConfirmDialogModule } from '@b3networks/shared/ui/confirm-dialog';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AgileCRMComponent } from './integration-setting/agile-crm/agile-crm.component';
import { ExampleComponent } from './integration-setting/example/example.component';
import { FreshDeskComponent } from './integration-setting/fresh-desk/fresh-desk.component';
import { HttpsNotificationComponent } from './integration-setting/https-notification/https-notification.component';
import { IntegrationSettingComponent } from './integration-setting/integration-setting.component';
import { UserVoiceComponent } from './integration-setting/user-voice/user-voice.component';
import { WebhookComponent } from './integration-setting/webhook/webhook.component';
import { ZenDeskComponent } from './integration-setting/zen-desk/zen-desk.component';
import { IntegrationComponent } from './integration.component';

const routes: Route[] = [
  { path: '', component: IntegrationSettingComponent }
  // { path: 'details/:type', component: IntegrationSettingComponent }
];

@NgModule({
  declarations: [
    IntegrationComponent,
    IntegrationSettingComponent,
    AgileCRMComponent,
    FreshDeskComponent,
    UserVoiceComponent,
    ZenDeskComponent,
    WebhookComponent,
    ExampleComponent,
    HttpsNotificationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedUiConfirmDialogModule,
    SharedUiMaterialModule
  ]
})
export class IntegrationModule {}
