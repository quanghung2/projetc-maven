import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { PublicAccessGuard } from '../core/services/public-access.guard';
import { PublicReleaseNoteComponent } from './public-release-note.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: PublicReleaseNoteComponent,
        canActivate: [PublicAccessGuard]
      }
    ]),
    SharedUiMaterialModule
  ],
  declarations: [PublicReleaseNoteComponent]
})
export class PublicReleaseNoteModule {}
