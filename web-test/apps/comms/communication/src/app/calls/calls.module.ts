import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallsComponent } from './calls.component';
import { RouterModule, Routes } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

const routes: Routes = [
  {
    path: '',
    component: CallsComponent,
    children: [
      {
        path: 'active_calls',
        loadChildren: () => import('./active-call/active-call.module').then(m => m.ActiveCallModule)
      },
      {
        path: 'callback_requests',
        loadChildren: () => import('./callback-requests/callback-requests.module').then(m => m.CallbackRequestsModule)
      },
      {
        path: 'completed_calls',
        loadChildren: () => import('./completed/completed.module').then(m => m.CompletedModule)
      },
      { path: '', redirectTo: 'active_call', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [CallsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatToolbarModule
  ]
})
export class CallsModule {}
