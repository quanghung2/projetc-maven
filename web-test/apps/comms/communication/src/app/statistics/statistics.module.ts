import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsComponent } from './statistics.component';
import { RouterModule, Routes } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';

const routes: Routes = [
  {
    path: '',
    component: StatisticsComponent,
    children: [
      {
        path: 'activity_log',
        loadChildren: () => import('../users/activities-log/activities-log.module').then(m => m.ActivitiesLogModule)
      },
      {
        path: 'assigned_calls',
        loadChildren: () => import('../users/assigned-calls/assigned-calls.module').then(m => m.AssignedCallsModule)
      },
      { path: '', redirectTo: 'activity_log', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [StatisticsComponent],
  imports: [CommonModule, RouterModule.forChild(routes), MatToolbarModule]
})
export class StatisticsModule {}
