import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BarRatingComponent } from './bar-rating.component';

@NgModule({
  declarations: [BarRatingComponent],
  imports: [CommonModule, MatIconModule, MatButtonModule],
  exports: [BarRatingComponent]
})
export class BarRatingModule {}
