import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Dashboard2,
  Dashboard2Card,
  DashboardV2Service,
  QuestionV2,
  Template,
  TEMPLATE_SLIDES
} from '@b3networks/api/dashboard';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { cloneDeep } from 'lodash';
import { combineLatest } from 'rxjs';
import { finalize, startWith, takeUntil, tap } from 'rxjs/operators';

export interface StoreDashboardV2Input {
  dashboard: Dashboard2;
  cards: Dashboard2Card[];
}

@Component({
  selector: 'b3n-store-dashboard-v2',
  templateUrl: './store-dashboard-v2.component.html',
  styleUrls: ['./store-dashboard-v2.component.scss']
})
export class StoreDashboardV2Component extends DestroySubscriberComponent implements OnInit {
  readonly TEMPLATE_SLIDES = TEMPLATE_SLIDES;
  readonly MAX_NAME_CHAR = 20;

  form: UntypedFormGroup;
  template: Template;
  activeSlide: number;
  activeTemplate: number;
  questions: QuestionV2[] = [];
  questionsFilter: QuestionV2[] = [];
  questionsMap: HashMap<QuestionV2> = {};
  saving: boolean;
  saveContent: string;
  initQuestionState: boolean;
  remainNameChar: number = this.MAX_NAME_CHAR;
  loading: boolean;

  constructor(
    public dialogRef: MatDialogRef<StoreDashboardV2Component>,
    @Inject(MAT_DIALOG_DATA) public data: StoreDashboardV2Input,
    private fb: UntypedFormBuilder,
    private dashboardV2Service: DashboardV2Service,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit() {
    this.loading = true;
    this.dashboardV2Service
      .getQuestions()
      .pipe(
        tap(questions => {
          this.questions = questions;
          this.questionsFilter = cloneDeep(questions);
          this.questions.forEach(question => {
            this.questionsMap[question.uuid] = question;
          });

          this.initForm();
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe();
  }

  initForm() {
    this.form = this.fb.group({
      selectTemplateForm: this.fb.group({
        name: ['', Validators.required],
        slide: [null, Validators.required],
        template: [null, Validators.required]
      }),
      selectQuestionForm: this.fb.group({
        questions: [[], Validators.required],
        search: [''],
        type: [1]
      })
    });

    this.nameFC.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap((value: string) => {
          if (value.length > this.MAX_NAME_CHAR) {
            const valid = value.slice(0, this.MAX_NAME_CHAR);
            this.nameFC.setValue(valid);
            this.remainNameChar = 0;
          } else {
            this.remainNameChar = this.MAX_NAME_CHAR - value.length;
          }
        })
      )
      .subscribe();

    this.slideFC.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(value => {
          this.activeSlide = value;
        })
      )
      .subscribe();

    this.templateFC.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(value => {
          this.activeTemplate = value;

          const slide = this.TEMPLATE_SLIDES.find(slide => slide.id === this.slideFC.value);
          const template = slide.templates.find(template => {
            return template.id === value;
          });

          this.template = template;
        })
      )
      .subscribe();

    combineLatest([this.search.valueChanges.pipe(startWith('')), this.type.valueChanges.pipe(startWith(1))])
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(([search, type]) => {
          const value = (search as string).toLowerCase().trim();
          this.questionsFilter = this.questions.filter(q => {
            const searchCondition = () => q.name?.toLowerCase().trim().includes(value);
            let filterCondition: () => void;

            switch (type) {
              case 1:
                filterCondition = null;
                break;

              case 2:
                filterCondition = () => q.isDefault;
                break;

              case 3:
                filterCondition = () => !q.isDefault;
                break;
            }

            return filterCondition ? searchCondition() && filterCondition() : searchCondition();
          });
        })
      )
      .subscribe();

    this.questionsFC.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(_ => {
          this.questionsChange();
        })
      )
      .subscribe();

    if (this.data.dashboard && this.data.cards) {
      const { name, config } = this.data.dashboard;
      const slide = this.TEMPLATE_SLIDES.find(s => s.templates.find(t => t.id === config.templateId));

      this.selectTemplateForm.patchValue({
        name: name,
        slide: slide.id,
        template: config.templateId
      });

      const selectedQuestion = this.data.cards
        .sort((a, b) => a.config.order - b.config.order)
        .map(card => card.questionUuid);

      if (!this.initQuestionState) {
        this.initQuestionState = true;
        selectedQuestion.forEach(uuid => {
          this.questionsMap[uuid].selected = true;
        });
      }

      this.questionsFC.setValue(selectedQuestion);
      this.saveContent = 'Update';
    } else {
      this.templateChange({ slide: 1, templateId: 1 });
      this.saveContent = 'Create';
    }
  }

  slideChange(slide: number) {
    this.activeSlide = slide;
  }

  templateChange(template: { slide: number; templateId: number }) {
    this.activeTemplate = template.templateId;
    this.slideFC.setValue(template.slide);
    this.templateFC.setValue(template.templateId);
  }

  questionsChange() {
    const uuids: string[] = this.questionsFC.value;

    if (!uuids) {
      return;
    }

    const setQuestionsMap = () => {
      this.questions.forEach(question => {
        if (!uuids.includes(question.uuid)) {
          this.questionsMap[question.uuid].disabled = true;
        }
      });
    };

    if (uuids.length < this.dashboardV2Service.globalConfig.maxWidget) {
      this.questions.forEach(question => {
        this.questionsMap[question.uuid].disabled = false;
      });
    } else {
      setQuestionsMap();
    }
  }

  optionClick(uuid: string) {
    this.questionsMap[uuid] = {
      ...this.questionsMap[uuid],
      selected: !this.questionsMap[uuid].selected
    };

    let selectedQuestion!: string[];

    if (!this.questionsFC.value.includes(uuid)) {
      selectedQuestion = [...this.questionsFC.value, uuid];
    } else {
      selectedQuestion = this.questionsFC.value.filter(question => question !== uuid);
    }

    this.questionsFC.setValue(selectedQuestion);
  }

  clearQuestions() {
    const selectedUuids = [...this.questionsFC.value];

    if (!selectedUuids.length) {
      return;
    }

    selectedUuids.forEach(uuid => {
      this.optionClick(uuid);
    });
  }

  async save() {
    this.saving = true;

    try {
      const dashboard =
        this.data.dashboard ??
        (await this.dashboardV2Service
          .createDashboard({
            name: this.form.value.selectTemplateForm.name,
            config: {
              templateId: this.template.id
            }
          })
          .toPromise());

      const cards: Partial<Dashboard2Card>[] = [];
      const uuids: string[] = this.questionsFC.value;

      uuids.forEach((uuid, index) => {
        const card: Partial<Dashboard2Card> = {
          dashboardUuid: dashboard.uuid,
          questionUuid: uuid,
          config: {
            ...this.template.configs[index % this.template.item],
            page: Math.floor(index / this.template.item) + 1,
            order: index
          }
        };

        if (this.data.cards) {
          card.uuid = this.data.cards.find(card => card.questionUuid === uuid)?.uuid;
        }

        cards.push(card);
      });

      if (this.data.dashboard && this.data.cards) {
        await this.dashboardV2Service
          .updateDashboard(this.data.dashboard.uuid, {
            ...this.data.dashboard,
            name: this.selectTemplateForm.controls['name'].value,
            config: {
              templateId: this.templateFC.value
            }
          })
          .toPromise();

        const existedCards = cards.filter(card => {
          return this.data.cards.some(c => c.questionUuid === card.questionUuid);
        });

        if (existedCards.length) {
          const a = (await this.dashboardV2Service.updateCards(dashboard.uuid, existedCards).toPromise()) as any;
          a.sort((a, b) => a.config.order - b.config.order);
        }

        const deletedCards = this.data.cards.filter(card => {
          return cards.every(c => c.questionUuid !== card.questionUuid);
        });

        if (deletedCards.length) {
          const uuids = deletedCards.map(card => card.uuid).join(',');
          await this.dashboardV2Service.deleteCards(dashboard.uuid, uuids).toPromise();
        }

        const newCards = cards.filter(card => {
          return this.data.cards.every(c => c.questionUuid !== card.questionUuid);
        });

        if (newCards.length) {
          await this.dashboardV2Service.createCards(dashboard.uuid, newCards).toPromise();
        }

        this.dashboardV2Service.dashboard2TabsChanged$.next(this.data.dashboard.uuid);
      } else {
        await this.dashboardV2Service.createCards(dashboard.uuid, cards).toPromise();
      }

      this.toastService.success(
        `${this.data.dashboard && this.data.cards ? 'Update' : 'Create'} dashboard successfully`
      );
      this.dialogRef.close(this.data.dashboard && this.data.cards ? true : dashboard.uuid);
    } catch (e) {
      this.toastService.warning(e['message']);
    } finally {
      this.saving = false;
    }
  }

  get selectTemplateForm() {
    return this.form.controls['selectTemplateForm'] as UntypedFormGroup;
  }

  get selectQuestionForm() {
    return this.form.controls['selectQuestionForm'] as UntypedFormGroup;
  }

  get nameFC() {
    return this.selectTemplateForm.controls['name'];
  }

  get templateFC() {
    return this.selectTemplateForm.controls['template'];
  }

  get slideFC() {
    return this.selectTemplateForm.controls['slide'];
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
