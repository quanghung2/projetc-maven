import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatOptionModule,
  MatSelectModule,
  MatTabsModule
} from '@angular/material';
import { Route, RouterModule } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { NotificationSettingComponent } from './notification-setting/notification-setting.component';
import { SettingsComponent } from './settings.component';

const routes: Route[] = [{ path: '', component: SettingsComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),

    MatButtonModule,
    MatInputModule,
    FormsModule,
    MatDialogModule,
    MatOptionModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTabsModule,
    MatChipsModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  declarations: [SettingsComponent, NotificationSettingComponent],
  exports: []
})
export class SettingsModule {}
