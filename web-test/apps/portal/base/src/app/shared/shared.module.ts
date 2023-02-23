import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { LogoutDlg } from './modal/logout/logout.component';
import { SuccessModalComponent } from './modal/success.component';
import { SwitchOrganizationDialog } from './modal/switch-org/switch-org.component';

@NgModule({
  declarations: [LogoutDlg, SuccessModalComponent, SwitchOrganizationDialog],
  imports: [
    CommonModule,
    FormsModule,
    SharedCommonModule,
    SharedUiToastModule,
    FlexLayoutModule,
    SharedUiMaterialModule
  ]
})
export class SharedModule {}
