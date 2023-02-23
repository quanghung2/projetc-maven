import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Question, QuestionData, QuestionService } from '@b3networks/api/dashboard';
import { of } from 'rxjs';
import { finalize, flatMap } from 'rxjs/operators';
import { ToastService } from '@b3networks/shared/ui/toast';

export enum StoreType {
  create,
  update
}

@Component({
  selector: 'b3n-store-question',
  templateUrl: './store-question.component.html',
  styleUrls: ['./store-question.component.scss']
})
export class StoreQuestionComponent implements OnInit {
  StoreType = StoreType;

  type: StoreType;
  question: Question;
  progressing: boolean;

  constructor(
    private dialogRef: MatDialogRef<StoreQuestionComponent>,
    @Inject(MAT_DIALOG_DATA) question: Question,
    private questionService: QuestionService,
    private toastService: ToastService
  ) {
    this.type = this.question ? StoreType.update : StoreType.create;
    this.question = question || new Question();
    this.question.question = new QuestionData(); // fix for create new first
  }

  ngOnInit() {}

  progress() {
    this.progressing = true;

    of(this.type)
      .pipe(
        flatMap(type => {
          return type === StoreType.create
            ? this.questionService.create(this.question)
            : this.questionService.update(this.question);
        }),
        finalize(() => (this.progressing = false))
      )
      .subscribe(
        dashboard => {
          this.dialogRef.close(dashboard);
          this.toastService.success(`Dashboard ${this.question.name} has been created`);
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }
}
