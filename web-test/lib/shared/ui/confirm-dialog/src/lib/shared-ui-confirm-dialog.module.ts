import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    FlexLayoutModule,
    MatButtonModule,
    MatDialogModule,
    SharedUiMaterialModule
  ],
  declarations: [ConfirmDialogComponent],
  exports: [ConfirmDialogComponent]
})
export class SharedUiConfirmDialogModule {}
