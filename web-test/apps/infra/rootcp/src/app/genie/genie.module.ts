import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { ConfigB3WorksAppDialogComponent } from './config-b3works-app-dialog/config-b3works-app-dialog.component';
import { ConfigComplianceDialogComponent } from './config-compliance-dialog/config-compliance-dialog.component';
import { DownloadLogDialogComponent } from './download-log-dialog/download-log-dialog.component';
import { FillParamsDialogComponent } from './fill-params-dialog/fill-params-dialog.component';
import { GenieComponent } from './genie.component';
import { EditPolicyComponent } from './manage-service/edit-policy/edit-policy.component';
import { ManageServiceComponent } from './manage-service/manage-service.component';
import { MappingToolDialogComponent } from './mapping-tool-dialog/mapping-tool-dialog.component';
import { RemoveBlacklistEmailComponent } from './remove-blacklist-email/remove-blacklist-email.component';
import { ShowResultDialogComponent } from './show-result-dialog/show-result-dialog.component';
import { SipConcurrentCallDialogComponent } from './sip-concurrent-call-dialog/sip-concurrent-call-dialog.component';
import { SmsBlacklistDialogComponent } from './sms-blacklist-dialog/sms-blacklist-dialog.component';
import { ToggleDemoDialogComponent } from './toggle-demo-dialog/toggle-demo-dialog.component';

const routes: Route[] = [
  {
    path: '',
    component: GenieComponent,
    children: []
  }
];

@NgModule({
  declarations: [
    GenieComponent,
    FillParamsDialogComponent,
    ShowResultDialogComponent,
    DownloadLogDialogComponent,
    MappingToolDialogComponent,
    ToggleDemoDialogComponent,
    ConfigComplianceDialogComponent,
    ConfigB3WorksAppDialogComponent,
    SmsBlacklistDialogComponent,
    SipConcurrentCallDialogComponent,
    ManageServiceComponent,
    EditPolicyComponent,
    RemoveBlacklistEmailComponent
  ],
  imports: [RouterModule.forChild(routes), SharedModule]
})
export class GenieModule {}
