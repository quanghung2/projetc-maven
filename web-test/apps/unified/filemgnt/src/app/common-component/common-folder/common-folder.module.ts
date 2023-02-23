import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { MatNativeDateModule } from '@matheo/datepicker/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedCommonModule } from '@b3networks/shared/common';
import { RouterModule, Routes } from '@angular/router';
import { CommonFolderComponent } from './common-folder.component';
import { CommonFileModule } from '../common-file/common-file.module';

const routes: Routes = [
  {
    path: ':name',
    loadChildren: () => import('../common-file/common-file.module').then(m => m.CommonFileModule)
  }
];

@NgModule({
  declarations: [CommonFolderComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedAuthModule,
    SharedUiMaterialModule,
    SharedCommonModule,
    MatNativeDateModule,
    CommonFileModule,
    RouterModule.forChild(routes)
  ],
  exports: [CommonFolderComponent]
})
export class CommonFolderModule {}
