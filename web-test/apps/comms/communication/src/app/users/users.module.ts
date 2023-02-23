import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersComponent } from './users.component';
import { RouterModule, Routes } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AssignedCallsComponent } from './assigned-calls/assigned-calls.component';
import { MatTableModule } from '@angular/material/table';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatIconModule } from '@angular/material/icon';
import { AssignedCallsModule } from './assigned-calls/assigned-calls.module';

const routes: Routes = [
  {
    path: '',
    component: UsersComponent,
    children: [
      {
        path: 'performance',
        loadChildren: () => import('./agent-list/agent-list.module').then(m => m.AgentListModule)
      },
      {
        path: 'activity_log',
        loadChildren: () => import('./activities-log/activities-log.module').then(m => m.ActivitiesLogModule)
      },
      {
        path: 'assigned_calls',
        loadChildren: () => import('./assigned-calls/assigned-calls.module').then(m => m.AssignedCallsModule)
      },
      { path: '', redirectTo: 'performance', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [UsersComponent],
  exports: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatToolbarModule,
    MatTableModule,
    ClipboardModule,
    MatIconModule
  ]
})
export class UsersModule {}
