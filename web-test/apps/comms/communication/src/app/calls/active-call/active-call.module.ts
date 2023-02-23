import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ActiveCallComponent } from './active-call.component';
import { ViewCallComponent } from './view-call/view-call.component';

const routes: Route[] = [{ path: '', component: ActiveCallComponent }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    SharedAuthModule,
    SharedCommonModule
  ],
  declarations: [ActiveCallComponent, ViewCallComponent],
  providers: []
})
export class ActiveCallModule {}
