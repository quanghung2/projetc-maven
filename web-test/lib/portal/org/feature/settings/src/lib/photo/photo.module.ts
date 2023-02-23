import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoComponent } from './photo.component';
import { MatIconModule } from '@angular/material/icon';
import { FlexModule } from '@angular/flex-layout';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@NgModule({
  declarations: [PhotoComponent],
  imports: [CommonModule, MatIconModule, FlexModule, MatProgressBarModule],
  exports: [PhotoComponent]
})
export class PhotoModule {}
