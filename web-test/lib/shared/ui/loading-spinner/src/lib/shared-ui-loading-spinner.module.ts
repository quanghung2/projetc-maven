import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SpinnerComponent } from './spinner/spinner.component';

@NgModule({
  imports: [CommonModule, MatProgressSpinnerModule, OverlayModule],
  declarations: [SpinnerComponent]
})
export class SharedUiLoadingSpinnerModule {}
