import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Route, RouterModule } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { ClipboardModule } from 'ngx-clipboard';
import { PortalMemberSettingSharedModule } from '../../shared/shared.module';
import { CreateComponent } from './create/create.component';
import { OutboundRuleListComponent } from './outbound-rule-list/outbound-rule-list.component';
import { OutboundRuleComponent } from './outbound-rule.component';

const routes: Route[] = [
  { path: '', component: OutboundRuleListComponent }
  // { path: '', component: OutboundRuleDetailComponent },
  // { path: 'manage-outbound', component: OutboundRuleListComponent }
];

@NgModule({
  declarations: [OutboundRuleComponent, CreateComponent, OutboundRuleListComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    SharedUiPortalModule,
    ClipboardModule,
    PortalMemberSettingSharedModule
  ],
  providers: [
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} }
  ]
})
export class OutboundRuleModule {}
