import { AppCommonModule } from './../common/common.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SecurityRoutingModule } from './security-routing.module';
import { SecurityComponent } from './security.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [AppCommonModule, ReactiveFormsModule, SecurityRoutingModule],
  declarations: [SecurityComponent]
})
export class SecurityModule {}
