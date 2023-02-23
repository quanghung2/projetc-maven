import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Route, RouterModule } from '@angular/router';
import { BarRatingModule } from '../../lib/bar-rating/bar-rating.module';
import { ErrorPageComponent } from './../error-page/error-page.component';
import { PostCallSurveyContentComponent } from './post-call-survey-content/post-call-survey-content.component';
import { PostCallSurveyComponent } from './post-call-survey.component';
import { SuccessPageComponent } from './survey-success-page/survey-success-page.component';

const routes: Route[] = [{ path: '', component: PostCallSurveyComponent }];

@NgModule({
  declarations: [PostCallSurveyComponent, PostCallSurveyContentComponent, ErrorPageComponent, SuccessPageComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    BarRatingModule,
    MatFormFieldModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    FlexLayoutModule
  ]
})
export class PostCallSurveyModule {}
