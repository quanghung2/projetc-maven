import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { PublicHolidayComponent } from './public-holiday.component';
import { UpdateCustomHolidayComponent } from './update-custom-holiday/update-custom-holiday.component';
import { UpdatePublicHolidayComponent } from './update-public-holiday/update-public-holiday.component';

export const routes: Routes = [{ path: '', component: PublicHolidayComponent }];

@NgModule({
  declarations: [PublicHolidayComponent, UpdateCustomHolidayComponent, UpdatePublicHolidayComponent],
  imports: [
    CommonModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    RouterModule.forChild(routes),
    FormsModule,
    SharedUiMaterialModule
  ]
})
export class PublicHolidayModule {}
