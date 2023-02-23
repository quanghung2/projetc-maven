import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragScrollComponent } from './ngx-drag-scroll.component';
import { DragScrollItemDirective } from './ngx-drag-scroll-item';

@NgModule({
  imports: [CommonModule],
  exports: [DragScrollComponent, DragScrollItemDirective],
  declarations: [DragScrollComponent, DragScrollItemDirective]
})
export class SharedUiDragScrollModule {}
