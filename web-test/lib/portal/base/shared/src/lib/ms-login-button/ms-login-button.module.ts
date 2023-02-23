import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import {MsLoginButtonComponent} from "./ms-login-button.component";

@NgModule({
  imports: [CommonModule, SharedUiMaterialModule],
  exports: [MsLoginButtonComponent],
  declarations: [MsLoginButtonComponent]
})
export class MsLoginButtonModule {}
