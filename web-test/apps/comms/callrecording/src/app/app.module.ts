import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ClipboardModule } from 'ngx-clipboard';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { ModalComponent } from './app-modal/modal.component';
import { AppComponent } from './app.component';
import { AppRoutes } from './app.routes';
import {
  ComplianceAddUserModalComponent,
  ComplianceDeleteUserModalComponent,
  ComplianceModalComponent,
  ComplianceRemoveRoleModalComponent,
  ComplianceSettingModalComponent,
  ComplianceUpdateUserModalComponent
} from './compliance';
import { SubscribeMoreModalComponent } from './contact';
import { PageNotFoundComponent } from './exception';
import {
  HistoryArchivedModalComponent,
  HistoryArchiveModalComponent,
  HistoryComponent,
  HistoryNoteModalComponent
} from './history';
import { BackupConfigModalComponent } from './history/backup-config-modal/backup-config-modal.component';
import { ExportEmailModalComponent } from './history/export-email-modal/export-email-modal.component';
import { MainComponent } from './main/main.component';
import {
  ManagerAddMemberModalComponent,
  ManagerComponent,
  ManagerSettingsModalComponent,
  ManagerUpdateMemberModalComponent
} from './manager';
import { AclActionModalComponent } from './new-compliance/acl/acl-action-modal/acl-action-modal.component';
import { AclComponent } from './new-compliance/acl/acl.component';
import { CalleridsViewModalComponent } from './new-compliance/acl/callerids-view-modal/callerids-view-modal.component';
import { EncryptComponent } from './new-compliance/encrypt/encrypt.component';
import { NewComplianceComponent } from './new-compliance/new-compliance.component';
import { NewHistoryComponent } from './new-history/new-history.component';
import { PaymentComponent } from './payment/payment.component';
import {
  AppBizPhone,
  AppDirectLine,
  AppSip,
  AppVirtualLine,
  AuthInterceptor,
  DurationPipe,
  MsApps,
  MsAuth,
  MsNumber,
  MsStore,
  MsSubscription,
  SharedServices,
  SubscriptionInfoPipe
} from './shared';
import { OrgMemberPipe } from './shared/pipe/org-member.pipe';
import { SubscriptionLicenseService } from './shared/service/subscription-license.service';
import { SubscriptionComponent } from './subscription';
import {
  AssignModalComponent,
  BizphoneModalComponent,
  DirectlineModalComponent,
  SettingConfigComponent,
  SipModalComponent,
  VirtuallineModalComponent
} from './subscription/';

@NgModule({
  declarations: [
    DurationPipe,
    SubscriptionInfoPipe,
    OrgMemberPipe,

    AppComponent,
    ModalComponent,
    PageNotFoundComponent,

    MainComponent,

    HistoryComponent,
    HistoryNoteModalComponent,
    HistoryArchiveModalComponent,
    HistoryArchivedModalComponent,

    SubscriptionComponent,
    AssignModalComponent,
    BizphoneModalComponent,
    VirtuallineModalComponent,
    DirectlineModalComponent,
    SipModalComponent,
    SettingConfigComponent,

    PaymentComponent,
    SubscribeMoreModalComponent,
    ManagerComponent,
    ManagerAddMemberModalComponent,
    ManagerUpdateMemberModalComponent,
    ManagerSettingsModalComponent,
    ComplianceModalComponent,
    ComplianceAddUserModalComponent,
    ComplianceSettingModalComponent,
    ComplianceUpdateUserModalComponent,
    ComplianceRemoveRoleModalComponent,
    ComplianceUpdateUserModalComponent,
    ComplianceDeleteUserModalComponent,
    BackupConfigModalComponent,
    ExportEmailModalComponent,
    NewComplianceComponent,
    EncryptComponent,
    AclComponent,
    NewHistoryComponent,
    AclActionModalComponent,
    CalleridsViewModalComponent,
    AccessDeniedComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule,
    ClipboardModule,
    // routes
    AppRoutes
  ],
  providers: [
    MsNumber,
    MsStore,
    MsSubscription,
    MsApps,
    MsAuth,
    AppVirtualLine,
    AppDirectLine,
    AppSip,
    AppBizPhone,
    SharedServices,
    SubscriptionLicenseService,
    AuthInterceptor,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
