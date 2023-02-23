import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AddBlockNumberComponent } from './add-block-number/add-block-number.component';
import { BlackListComponent } from './black-list.component';
import { DeleteBlockNumberComponent } from './delete-block-number/delete-block-number.component';

const routes: Route[] = [{ path: '', component: BlackListComponent }];

@NgModule({
  declarations: [BlackListComponent, DeleteBlockNumberComponent, AddBlockNumberComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedAuthModule,
    SharedUiMaterialModule
  ]
})
export class CommsIvrSharedBlackListModule {}
