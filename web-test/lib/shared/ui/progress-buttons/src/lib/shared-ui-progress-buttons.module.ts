import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SpinnerButtonComponent } from './spinner-button/spinner-button.component';

/**
 * Cloned from https://github.com/michaeldoye/mat-progress-buttons to supported angular 9
 */
@NgModule({
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatIconModule,
    MatButtonModule
  ],
  declarations: [SpinnerButtonComponent],
  exports: [SpinnerButtonComponent]
})
export class SharedUiProgressButtonsModule {}
