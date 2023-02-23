import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorPageComponent } from './error-page.component';
import { RouterModule, Routes } from '@angular/router';
import {FlexLayoutModule} from "@angular/flex-layout";

const routes: Routes = [{ path: '', component: ErrorPageComponent }];

@NgModule({
  declarations: [ErrorPageComponent],
  imports: [CommonModule, RouterModule.forChild(routes), FlexLayoutModule]
})
export class ErrorPageModule {}
