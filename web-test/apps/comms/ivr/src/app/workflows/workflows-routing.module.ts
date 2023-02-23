import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkflowsComponent } from './workflows.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', component: WorkflowsComponent },
      {
        path: ':uuid',
        loadChildren: () => import('./workflow-details/workflow-details.module').then(m => m.WorkflowDetailsModule)
      },
      {
        path: ':uuid/:version',
        loadChildren: () => import('./workflow-details/workflow-details.module').then(m => m.WorkflowDetailsModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkflowsRoutingModule {}
