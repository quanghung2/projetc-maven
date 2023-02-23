import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ChatSharedWhatsappModule } from '@b3networks/chat/shared/whatsapp';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule, SharedUiMaterialNativeDateModule } from '@b3networks/shared/ui/material';
import { EventsComponent } from './events.component';

const routes: Route[] = [
  {
    path: '',
    component: EventsComponent
  }
];

@NgModule({
  declarations: [EventsComponent],
  imports: [
    CommonModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    ChatSharedWhatsappModule,
    SharedUiMaterialNativeDateModule,
    RouterModule.forChild(routes)
  ]
})
export class ChatSharedEventsModule {}
