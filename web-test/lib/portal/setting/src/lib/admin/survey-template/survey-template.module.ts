import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SurveyTemplateComponent } from './survey-template.component';
import { ShareNoteTemplateModule } from '../queue/note-config/store-note-template/share-note-template.module';
import { StoreSurveyTemplateComponent } from './store-survey-template/store-survey-template.component';

const routes: Route[] = [{ path: '', component: SurveyTemplateComponent }];

@NgModule({
  declarations: [SurveyTemplateComponent, StoreSurveyTemplateComponent],
  imports: [
    CommonModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    ShareNoteTemplateModule,
    RouterModule.forChild(routes)
  ],
  exports: [SurveyTemplateComponent]
})
export class SurveyTemplateModule {}
