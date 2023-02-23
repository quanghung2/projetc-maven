import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { DashboardV2Service, QuestionV2, QUESTION_TYPE, Template } from '@b3networks/api/dashboard';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-select-question',
  templateUrl: './select-question.component.html',
  styleUrls: ['./select-question.component.scss']
})
export class SelectQuestionComponent extends DestroySubscriberComponent implements OnInit {
  @Output() optionClick = new EventEmitter<string>();
  @Output() clearQuestions = new EventEmitter<any>();

  @Input() form: UntypedFormGroup;
  @Input() questions: QuestionV2[] = [];
  @Input() questionsFilter: QuestionV2[] = [];
  @Input() questionsMap: HashMap<QuestionV2> = {};
  @Input() saving: boolean;
  @Input() template: Template;

  readonly QUESTION_TYPE = QUESTION_TYPE;

  hasCustom: boolean;
  maxWidgets: number;

  constructor(public dashboardV2Service: DashboardV2Service) {
    super();
  }

  ngOnInit() {
    this.maxWidgets = this.dashboardV2Service.globalConfig.maxWidget;
    this.hasCustom = !!this.questions.find(q => !q.isDefault);
    this.questionsFC.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(questions => {
          if (questions && questions[0] === -1) {
            this.questionsFC.setValue([]);
          }
        })
      )
      .subscribe();
  }

  get selectQuestionForm() {
    return this.form.controls['selectQuestionForm'] as UntypedFormGroup;
  }

  get search() {
    return this.selectQuestionForm.controls['search'];
  }

  get type() {
    return this.selectQuestionForm.controls['type'];
  }

  get questionsFC() {
    return this.selectQuestionForm.controls['questions'];
  }
}
