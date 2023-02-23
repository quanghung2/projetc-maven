import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'ngx-color-picker';
import { AppCommonModule } from './../common/common.module';
import { LoginPreviewComponent } from './components/login-preview/login-preview.component';
import { GeneralComponent } from './general.component';
@NgModule({
  imports: [CommonModule, FormsModule, ColorPickerModule, AppCommonModule],
  declarations: [GeneralComponent, LoginPreviewComponent]
})
export class GeneralModule {}
