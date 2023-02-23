import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { ChatSharedLivechatModule } from '@b3networks/chat/shared/livechat';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NgxMaskModule } from 'ngx-mask';
import { ContactsComponent } from './contacts.component';
import { DetailsComponent } from './details/details.component';
import { TxnInformationComponent } from './details/txn-information/txn-information.component';
import { TxnMembersComponent } from './details/txn-members/txn-members.component';
import { EmptyHeaderComponent } from './empty-info/empty-header/empty-header.component';
import { EmptyInfoComponent } from './empty-info/empty-info.component';

const routes: Route[] = [
  {
    path: '',
    component: ContactsComponent,
    children: [
      {
        path: ':uuid',
        component: EmptyInfoComponent,
        data: { disableMainSidebar: true }
      }
    ]
  },
  {
    path: ':contactUuid',
    component: ContactsComponent,
    children: [
      {
        path: 'txns',
        loadChildren: () => import('@b3networks/chat/shared/txns').then(m => m.ChatSharedTxnsModule)
      },
      {
        path: 'histories',
        loadChildren: () => import('@b3networks/chat/shared/histories').then(m => m.ChatSharedHistoriesModule)
      }
    ]
  }
];

@NgModule({
  declarations: [
    ContactsComponent,
    DetailsComponent,
    EmptyInfoComponent,
    EmptyHeaderComponent,
    TxnMembersComponent,
    TxnInformationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    NgxMaskModule.forRoot(),

    SharedCommonModule,
    SharedUiMaterialModule,
    InfiniteScrollModule,

    CommsSharedModule,
    ChatSharedCoreModule,
    ChatSharedLivechatModule,
    SharedUiPortalModule
  ]
})
export class ChatSharedContactModule {}
