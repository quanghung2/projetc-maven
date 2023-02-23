import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CompletedChatsComponent } from './completed-chats.component';

const routes: Route[] = [{ path: '', component: CompletedChatsComponent }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    SharedAuthModule,
    SharedCommonModule,
    ChatSharedCoreModule
  ],
  declarations: [CompletedChatsComponent],
  providers: []
})
export class CompletedChatsModule {}
