import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Route, RouterModule } from '@angular/router';
import { QuestionDetailComponent } from './question-detail/question-detail.component';
import { QuestionComponent } from './question/question.component';
import { QuestionSharedModule } from './shared/shared.module';

const routes: Route[] = [
  { path: '', component: QuestionComponent },
  { path: ':uuid', component: QuestionDetailComponent }
];

@NgModule({
  declarations: [QuestionComponent, QuestionDetailComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),

    QuestionSharedModule,

    LayoutModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSnackBarModule
  ]
})
export class UniversalDashboardFeatureQuestionModule {}
