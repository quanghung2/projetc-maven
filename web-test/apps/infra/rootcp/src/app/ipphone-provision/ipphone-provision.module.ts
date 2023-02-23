import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { CreateTemplateComponent } from './create-template/create-template.component';
import { IpphoneProvisionComponent } from './ipphone-provision.component';
import { SampleDataComponent } from './sample-data/sample-data.component';

const routes: Route[] = [
  {
    path: '',
    component: IpphoneProvisionComponent
  }
];

@NgModule({
  declarations: [IpphoneProvisionComponent, CreateTemplateComponent, SampleDataComponent],
  imports: [RouterModule.forChild(routes), SharedModule]
})
export class IpphoneProvisionModule {}
