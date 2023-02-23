import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SsoPageComponent } from './sso-page.component';
import { RouterModule, Routes } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedUiLoadingSpinnerModule } from '@b3networks/shared/ui/loading-spinner';

const routes: Routes = [
  {
    path: '',
    component: SsoPageComponent
  }
];

@NgModule({
  declarations: [SsoPageComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiLoadingSpinnerModule,
    FlexLayoutModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  exports: [SsoPageComponent]
})
export class SsoPageModule {}
