import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, Routes } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { OverviewComponent } from './overview.component';

const routes: Routes = [{ path: '', component: OverviewComponent }];

@NgModule({
  declarations: [OverviewComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiPortalModule,
    FlexLayoutModule,
    MatChipsModule,
    CommsSharedModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatTooltipModule
  ]
})
export class OverviewModule {}
