import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { PhotoModule } from '@b3networks/portal/org/feature/settings';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SidebarSettingsComponent } from './sidebar-settings.component';

@NgModule({
  declarations: [SidebarSettingsComponent],
  exports: [SidebarSettingsComponent],
  imports: [
    CommonModule,
    RouterModule,
    FlexLayoutModule,
    PhotoModule,
    MatProgressBarModule,
    MatIconModule,
    MatDividerModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatToolbarModule,
    FormsModule,
    ReactiveFormsModule,
    SharedCommonModule
  ]
})
export class SidebarSettingsModule {}
