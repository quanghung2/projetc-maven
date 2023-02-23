import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { QuestionV2, Template, TEMPLATE_SLIDES } from '@b3networks/api/dashboard';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';

@Component({
  selector: 'b3n-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss']
})
export class PreviewComponent extends DestroySubscriberComponent implements OnChanges {
  @Output() close = new EventEmitter<boolean>();
  @Output() save = new EventEmitter();
  @Output() optionClick = new EventEmitter<string>();

  @Input() saveContent: string;
  @Input() form: UntypedFormGroup;
  @Input() template: Template;
  @Input() questions: QuestionV2[] = [];
  @Input() questionsFilter: QuestionV2[] = [];
  @Input() questionsMap: HashMap<QuestionV2> = {};
  @Input() saving: boolean;

  pageCount: number;
  activePage: number = 0;
  filters: string[] = [];

  readonly TEMPLATE_SLIDES = TEMPLATE_SLIDES;

  constructor() {
    super();
  }

  ngOnChanges() {
    this.pageCount = Math.ceil(this.questionsFC.value.length / this.template.item);
    this.filters = [];
    this.questionsFC.value.forEach(q => {
      const questionV2 = this.questionsMap[q];
      questionV2.question.filtersMap.forEach(f => {
        if (!this.filters.includes(f)) {
          this.filters.push(f);
        }
      });
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }

    const temp = [...event.container.data];
    this.questionsFC.setValue(temp);
  }

  get selectQuestionForm() {
    return this.form.controls['selectQuestionForm'] as UntypedFormGroup;
  }

  get search() {
    return this.selectQuestionForm.controls['search'];
  }

  get questionsFC() {
    return this.selectQuestionForm.controls['questions'];
  }
}
