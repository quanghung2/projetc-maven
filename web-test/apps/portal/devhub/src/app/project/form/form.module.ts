import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { FormStoreItemComponent } from './form-store-item/form-store-item.component';
import { FormStoreComponent } from './form-store/form-store.component';
import { FormComponent } from './form.component';
import { FormDetailsComponent } from './form-details/form-details.component';

const routes: Routes = [{ path: '', component: FormComponent }];

@NgModule({
  declarations: [FormComponent, FormStoreComponent, FormStoreItemComponent, FormDetailsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedCommonModule
  ]
})
export class FormModule {}
