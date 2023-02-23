import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule, MAT_DATE_FORMATS } from '@angular/material/core';
import { Route, RouterModule } from '@angular/router';
import {
  CommsCallcenterSharedModule,
  MY_FORMATS,
  NumberActionPipe,
  NumberStatusPipe
} from '@b3networks/comms/callcenter/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ConfirmChangeStatusComponent } from './confirm-change-stt/confirm-change-stt.component';
import { DeleteNumberListComponent } from './delete-number-list/delete-number-list.component';
import { DuplicateNumberListsDialogComponent } from './duplicate-number-list-dialog/duplicate-number-list-dialog.component';
import { NumberListsComponent } from './number-lists.component';
import { ForceHangupPipe } from './numbers-management/force-hangup.pipe';
import { NumbersManagementComponent } from './numbers-management/numbers-management.component';
import { UploadNumbersComponent } from './numbers-management/upload-numbers/upload-numbers.component';
import { ScheduleNumberListComponent } from './schedule-number-list/schedule-number-list.component';
import { StoreNumberListComponent } from './store-number-list/store-number-list.component';

const routes: Route[] = [
  {
    path: '',
    component: NumberListsComponent
  },
  { path: ':numberListId', component: NumbersManagementComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    RouterModule.forChild(routes),

    SharedCommonModule,
    CommsCallcenterSharedModule,

    SharedUiMaterialModule,
    MatNativeDateModule
  ],
  declarations: [
    NumberListsComponent,
    NumbersManagementComponent,
    DuplicateNumberListsDialogComponent,
    DeleteNumberListComponent,
    UploadNumbersComponent,
    ConfirmChangeStatusComponent,
    StoreNumberListComponent,
    ScheduleNumberListComponent,
    ForceHangupPipe
  ],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }],
  exports: [NumberStatusPipe, NumberActionPipe]
})
export class NumberListsModule {
  constructor() {}
}
