import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ClipboardModule } from 'ngx-clipboard';
import { LazyLoadDirective } from './lazyload-dom.directive';
import { ReleaseNoteComponent } from './release-note.component';

const routes: Routes = [{ path: '', component: ReleaseNoteComponent }];

@NgModule({
  declarations: [ReleaseNoteComponent, LazyLoadDirective],
  imports: [
    CommonModule,
    SharedUiMaterialModule,
    FormsModule,
    ClipboardModule,
    RouterModule.forChild(routes),
    ChatSharedCoreModule,
    SharedCommonModule
  ]
})
export class ReleaseNoteModule {}
