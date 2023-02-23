import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingComponent } from './landing.component';
import { RouterModule, Routes } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CreateProjectDialogComponent } from './create-project-dialog/create-project-dialog.component';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import {ReactiveFormsModule} from "@angular/forms";

const routes: Routes = [{ path: '', component: LandingComponent }];

@NgModule({
  declarations: [LandingComponent, CreateProjectDialogComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FlexLayoutModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    SharedUiMaterialModule,
    ReactiveFormsModule
  ]
})
export class LandingModule {}
