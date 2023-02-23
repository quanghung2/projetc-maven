import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { CreateServerDialogComponent } from './create-server-dialog/create-server-dialog.component';
import { DetailServerDialogComponent } from './detail-server-dialog/detail-server-dialog.component';
import { ServerComponent } from './server.component';

const routes: Route[] = [
  {
    path: '',
    component: ServerComponent,
    children: []
  }
];

@NgModule({
  declarations: [ServerComponent, CreateServerDialogComponent, DetailServerDialogComponent],
  imports: [RouterModule.forChild(routes), SharedModule]
})
export class ServerModule {}
