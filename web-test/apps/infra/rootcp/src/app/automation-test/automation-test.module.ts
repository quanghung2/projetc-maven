import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AutomationTestComponent } from './automation-test.component';

const routes: Route[] = [
  {
    path: '',
    component: AutomationTestComponent,
    children: []
  }
];

@NgModule({
  declarations: [AutomationTestComponent],
  imports: [RouterModule.forChild(routes), SharedModule]
})
export class AutomationTestModule {}
