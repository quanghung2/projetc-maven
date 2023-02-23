import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
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
import { ListEndTxnsComponent } from './list-end-txns/list-end-txns.component';
import { ListInboxTxnsComponent } from './list-inbox-txns/list-inbox-txns.component';
import { ListTxnsComponent } from './list-txns/list-txns.component';
import { TxnSharedModule } from './share/txn-shared.module';
import { TxnsComponent } from './txns.component';

const routes: Route[] = [
  {
    path: '',
    component: TxnsComponent,
    children: [
      { path: '', component: ListTxnsComponent },
      { path: 'active', component: ListTxnsComponent },
      { path: 'end', component: ListEndTxnsComponent }
    ]
  },
  {
    path: 'inboxes/:inboxUuid',
    component: TxnsComponent,
    children: [{ path: '', component: ListInboxTxnsComponent }]
  }
];
@NgModule({
  declarations: [TxnsComponent, ListTxnsComponent, ListEndTxnsComponent, ListInboxTxnsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
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
    FlexLayoutModule,
    TxnSharedModule
  ]
})
export class ChatSharedTxnsModule {}
