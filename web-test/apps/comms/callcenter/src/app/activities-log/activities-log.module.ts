import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommsCallcenterSharedModule } from '@b3networks/comms/callcenter/shared';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ActivitiesLogComponent } from './activities-log.component';
import { RemarksDialogComponent } from './remarks/remarks-dialog.component';

const routes = [
  {
    path: '',
    component: ActivitiesLogComponent,
    children: []
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DragDropModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    SharedAuthModule,
    CommsCallcenterSharedModule,

    SharedUiMaterialModule
  ],
  declarations: [ActivitiesLogComponent, RemarksDialogComponent]
})
export class ActivitiesLogModule {}
