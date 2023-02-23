import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CallerIdPipe } from './pipe/caller-id.pipe';
import { SelectExtensionPipe } from './pipe/select-ext.pipe';

@NgModule({
  declarations: [SelectExtensionPipe, CallerIdPipe],
  imports: [CommonModule],
  exports: [SelectExtensionPipe, CallerIdPipe]
})
export class SharedModule {}
