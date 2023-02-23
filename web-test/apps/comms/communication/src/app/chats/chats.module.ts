import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatMenu } from '../shared';
import { ChatsComponent } from './chats.component';

const routes: Routes = [
  {
    path: '',
    component: ChatsComponent,
    children: [
      {
        path: ChatMenu.assigned_chats,
        loadChildren: () => import('./assigned-chats/assigned-chats.module').then(m => m.AssignedChatsModule)
      },
      {
        path: ChatMenu.pending_chats,
        loadChildren: () => import('./pending-chats/pending-chats.module').then(m => m.PendingChatsModule)
      },
      {
        path: ChatMenu.completed_chats,
        loadChildren: () => import('./completed-chats/completed-chats.module').then(m => m.CompletedChatsModule)
      },
      { path: '', redirectTo: ChatMenu.completed_chats, pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [ChatsComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class ChatsModule {}
