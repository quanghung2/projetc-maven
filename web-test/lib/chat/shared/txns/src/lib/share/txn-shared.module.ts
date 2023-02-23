import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { ChatSharedLivechatModule } from '@b3networks/chat/shared/livechat';
import { ChatSharedWhatsappModule } from '@b3networks/chat/shared/whatsapp';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { PortalOrgSharedHistoryModule } from '@b3networks/portal/org/feature/history';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { UiScrollModule } from 'ngx-ui-scroll';
import { CaseHeaderComponent } from './case-header/case-header.component';
import { TxnsContentComponent } from './txns-content/txns-content.component';
import { TxnsFooterComponent } from './txns-footer/txns-footer.component';

const COMPONENTS = [CaseHeaderComponent, TxnsFooterComponent, TxnsContentComponent];

@NgModule({
  declarations: [COMPONENTS],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    SharedCommonModule,
    SharedAuthModule,
    InfiniteScrollModule,
    SharedUiMaterialModule,
    SharedUiPortalModule,
    CommsSharedModule,
    ChatSharedCoreModule,
    ChatSharedWhatsappModule,
    ChatSharedLivechatModule,
    PortalOrgSharedHistoryModule,
    UiScrollModule,
    FlexLayoutModule
  ],
  exports: [COMPONENTS]
})
export class TxnSharedModule {}
