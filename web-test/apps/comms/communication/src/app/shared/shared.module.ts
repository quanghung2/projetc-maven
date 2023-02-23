import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { ChatSharedWhatsappModule } from '@b3networks/chat/shared/whatsapp';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { InviteMemberTxnComponent } from './component/invite-member-txn/invite-member-txn.component';
import { PreviewHistoryTxnComponent } from './component/preview-history-txn/preview-history-txn.component';
import { ActionBarComponent } from './component/sms-history/action-bar/action-bar.component';
import { SMSHistoryDetailComponent } from './component/sms-history/sms-history-detail/sms-history-detail.component';
import { SmsHistoryComponent } from './component/sms-history/sms-history.component';
import { TypeCampaignPipe } from './pipe/type-campaign.pipe';

const COMPONENT = [
  TypeCampaignPipe,
  SmsHistoryComponent,
  ActionBarComponent,
  SMSHistoryDetailComponent,
  PreviewHistoryTxnComponent,
  InviteMemberTxnComponent
];

@NgModule({
  declarations: [COMPONENT],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedUiMaterialModule,
    SharedAuthModule,
    SharedCommonModule,
    ChatSharedCoreModule,
    ChatSharedWhatsappModule
  ],
  exports: [COMPONENT]
})
export class SharedModule {}
