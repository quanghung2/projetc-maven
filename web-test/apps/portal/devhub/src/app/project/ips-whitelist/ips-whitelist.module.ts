import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IpsWhitelistComponent } from './ips-whitelist.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AddIpWhitelistDialogComponent } from './add-ip-whitelist-dialog/add-ip-whitelist-dialog.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [{ path: '', component: IpsWhitelistComponent }];

@NgModule({
  declarations: [IpsWhitelistComponent, AddIpWhitelistDialogComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedUiMaterialModule, FormsModule]
})
export class IpsWhitelistModule {}
