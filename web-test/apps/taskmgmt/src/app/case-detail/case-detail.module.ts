import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedModule } from '../shared/shared.module';
import { CaseActionsComponent } from './case-actions/case-actions.component';
import { CaseActivitiesComponent } from './case-activities/case-activities.component';
import { CaseActivityComponent } from './case-activities/case-activity/case-activity.component';
import { NewCommentComponent } from './case-activities/new-comment/new-comment.component';
import { CaseContentComponent } from './case-content/case-content.component';
import { CaseDetailComponent } from './case-detail.component';
import { CaseInfoComponent } from './case-info/case-info.component';
import { CaseRelatedComponent } from './case-related/case-related.component';

@NgModule({
  declarations: [
    CaseDetailComponent,
    CaseActionsComponent,
    CaseActivitiesComponent,
    CaseRelatedComponent,
    CaseContentComponent,
    CaseInfoComponent,
    CaseActivityComponent,
    NewCommentComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    ChatSharedCoreModule,
    SharedModule,
    SharedAuthModule
  ]
})
export class CaseDetailModule {}
