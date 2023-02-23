import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesComponent } from './notes.component';
import { RouterModule, Routes } from '@angular/router';
import { ViewConfigComponent } from './view-config/view-config.component';
import { DownloadComponent } from './download/download.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedCommonModule } from '@b3networks/shared/common';

const routes: Routes = [{ path: '', component: NotesComponent }];

@NgModule({
  declarations: [NotesComponent, ViewConfigComponent, DownloadComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FlexLayoutModule,
    ReactiveFormsModule,
    SharedUiMaterialModule,
    SharedCommonModule
  ]
})
export class NotesModule {}
