import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { CASConfigComponent } from './cas-config.component';
import { StoreCASConfigComponent } from './store-cas-config/store-cas-config.component';

const routes: Route[] = [
  {
    path: '',
    component: CASConfigComponent,
    children: []
  }
];

@NgModule({
  declarations: [CASConfigComponent, StoreCASConfigComponent],
  imports: [RouterModule.forChild(routes), SharedModule]
})
export class CASConfigModule {}
