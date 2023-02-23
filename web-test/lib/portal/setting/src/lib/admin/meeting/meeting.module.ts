import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { ManageConnectAccountComponent } from './manage-connect-account/manage-connect-account.component';
import { BookingMeetingComponent } from './meeting.component';

const routes: Routes = [
  {
    path: '',
    component: BookingMeetingComponent
  }
];
@NgModule({
  declarations: [BookingMeetingComponent, ManageConnectAccountComponent],
  exports: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    SharedUiPortalModule,
    SharedCommonModule
  ]
})
export class MeetingModule {}
