import { RouterModule, Routes } from '@angular/router';
import { CalleridRemarkComponent } from './callerid-remark/callerid-remark.component';
import { AccountInfoComponent } from './configure/account-info/account-info.component';
import { BackupLineComponent } from './configure/backup-line/backup-line.component';
import { CallRecordingComponent } from './configure/call-recording/call-recording.component';
import { ComplianceComponent } from './configure/compliance/compliance.component';
import { ConfigureComponent } from './configure/configure.component';
import { ConnectedDevicesComponent } from './configure/connected-devices/connected-devices.component';
import { CountryWhiteListComponent } from './configure/country-white-list/country-white-list.component';
import { DialPlanComponent } from './configure/dial-plan/dial-plan.component';
import { HistoryComponent } from './configure/history/history.component';
import { IncomingRulePlanComponent } from './configure/incoming-rule-plan/incoming-rule-plan.component';
import { IPWhiteListComponent } from './configure/ip-white-list/ip-white-list.component';
import { PinLoginComponent } from './configure/pin-login/pin-login.component';
import { RoutingConfigComponent } from './configure/routing-config/routing-config.component';
import { SubscriptionInfoComponent } from './configure/subscription-info/subscription-info.component';
import { ErrorPageComponent } from './error-page';
import { LandingComponent } from './landing/landing.component';

export const routes: Routes = [
  { path: 'landing', component: LandingComponent },
  { path: 'error', component: ErrorPageComponent },
  { path: 'callerid-remark', component: CalleridRemarkComponent },
  {
    path: 'configure',
    component: ConfigureComponent,
    children: [
      { path: '', redirectTo: 'account-info', pathMatch: 'full' },
      { path: 'account-info', component: AccountInfoComponent },
      { path: 'subscription-info', component: SubscriptionInfoComponent },
      { path: 'dial-plan', component: DialPlanComponent },
      { path: 'ip-white-list', component: IPWhiteListComponent },
      { path: 'incoming-rule-plan', component: IncomingRulePlanComponent },
      { path: 'country-white-list', component: CountryWhiteListComponent },
      { path: 'connected-devices', component: ConnectedDevicesComponent },
      { path: 'backup-line', component: BackupLineComponent },
      { path: 'call-recording', component: CallRecordingComponent },
      { path: 'compliance', component: ComplianceComponent },
      { path: 'history', component: HistoryComponent },
      { path: 'pin-login', component: PinLoginComponent },
      { path: 'routing-config', component: RoutingConfigComponent }
    ]
  }
];

export const appRoutingProviders: any[] = [];

export const appRouting = RouterModule.forRoot(routes);
