import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { ChatSharedWhatsappModule } from '@b3networks/chat/shared/whatsapp';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { ComposeModule } from './compose/compose.module';
import { EmailComponent } from './email.component';
import { SearchModule } from './search/search.module';
import { EmailSharedModule } from './shared/email-shared.module';

const routes: Route[] = [
  {
    path: '',
    component: EmailComponent,
    children: [
      {
        path: 'personal',
        loadChildren: () => import('./personal/personal.module').then(m => m.PersonalModule)
      },
      {
        path: 'teammate',
        loadChildren: () => import('./teammate/teammate.module').then(m => m.TeammateModule)
      },
      {
        path: 'team',
        loadChildren: () => import('./team/team.module').then(m => m.TeamModule)
      }
    ]
  }
];

@NgModule({
  declarations: [EmailComponent],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    EmailSharedModule,
    ComposeModule,
    SearchModule,
    ChatSharedCoreModule,
    ChatSharedWhatsappModule,
    SharedUiMaterialNativeDateModule,
    RouterModule.forChild(routes)
  ]
})
export class ChatSharedEmailModule {}
