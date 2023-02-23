import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { CaseDetailComponent } from '../case-detail/case-detail.component';
import { CaseDetailModule } from '../case-detail/case-detail.module';
import { SearchBarComponent } from '../header/search-bar/search-bar.component';
import { DeactivateGuard } from '../shared/guard/deactivate.guard';
import { SharedModule } from '../shared/shared.module';
import { CaseITemComponent } from './case-item/case-item.component';
import { CasesComponent } from './cases.component';
import { StoreCaseComponent } from './store-case/store-case.component';
import { SelectSupplierComponent } from './select-supplier/select-supplier.component';

const routes: Routes = [
  {
    path: '',
    component: CasesComponent
  },
  {
    path: 'create',
    component: StoreCaseComponent,
    canDeactivate: [DeactivateGuard]
  },
  {
    path: ':orgUuid/:id',
    component: CaseDetailComponent
  },
  {
    path: ':id',
    component: CaseDetailComponent
  }
];

@NgModule({
  declarations: [CasesComponent, StoreCaseComponent, CaseITemComponent, SearchBarComponent, SelectSupplierComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ReactiveFormsModule,

    RouterModule.forChild(routes),

    SharedCommonModule,
    SharedUiMaterialModule,
    SharedUiPortalModule,
    ChatSharedCoreModule,

    SharedModule,
    CaseDetailModule
  ]
})
export class CasesModule {}
