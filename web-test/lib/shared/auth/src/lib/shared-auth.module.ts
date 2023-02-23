import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { UserDatePipe } from './pipe/user-date.pipe';

const pipes = [UserDatePipe];

@NgModule({
  imports: [CommonModule],
  declarations: [pipes],
  exports: [pipes]
})
export class SharedAuthModule {}
