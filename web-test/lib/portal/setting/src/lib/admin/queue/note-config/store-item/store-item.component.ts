import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Item, TemplateModule } from '@b3networks/api/data';
import { DestroySubscriberComponent, MyErrorStateMatcher } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { takeUntil, tap } from 'rxjs/operators';

export interface StoreItemInput {
  item: Item;
}

export enum DEFAULT_SUPPORTED_TYPE {
  Text = 'text',
  Textarea = 'textarea',
  Number = 'number',
  Option = 'options'
}

export enum SURVEY_SUPPORTED_TYPE {
  Number = 'number',
  Option = 'options'
}

@Component({
  selector: 'b3n-store-item',
  templateUrl: './store-item.component.html',
  styleUrls: ['./store-item.component.scss']
})
export class StoreItemComponent extends DestroySubscriberComponent implements OnInit {
  private _item: Item;

  @Input() module: TemplateModule;
  @Input() set item(value: Item) {
    this._item = value;

    if (!this._item) {
      return;
    }

    const { label, options, type } = this._item;

    this.form.patchValue({
      label,
      type
    });

    this.options = [...options];
  }

  get item(): Item {
    return this._item;
  }

  @Input() isMaxQuestion: boolean;
  @Output() addItem = new EventEmitter<Item>();
  @Output() closed = new EventEmitter<boolean>();

  types: typeof SURVEY_SUPPORTED_TYPE | typeof DEFAULT_SUPPORTED_TYPE;
  matcher = new MyErrorStateMatcher();
  form: UntypedFormGroup;
  showOption: boolean;
  options: string[] = [];

  get lable() {
    return this.form?.controls['label'];
  }

  constructor(private fb: UntypedFormBuilder, private toastService: ToastService) {
    super();
  }

  ngOnInit() {
    if (this.module === 'survey') {
      this.types = SURVEY_SUPPORTED_TYPE;
    } else {
      this.types = DEFAULT_SUPPORTED_TYPE;
    }

    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      label: ['', [Validators.required, Validators.maxLength(2000)]],
      type: [this.types.Number, Validators.required],
      option: ''
    });

    this.form.controls['type'].valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(type => {
          this.option.reset();
          this.options = [];
          this.showOption = type === DEFAULT_SUPPORTED_TYPE.Option;
          if (this.showOption) {
            this.option.addValidators([Validators.maxLength(256)]);
            return;
          }
          this.option.clearValidators();
          this.option.updateValueAndValidity();
        })
      )
      .subscribe();
  }

  addOption() {
    if (this.options.length >= 10) {
      this.toastService.error('Exceeded the maximum number of Options that can be created (10)');
      return;
    }
    const option = this.option.value;

    if (this.options.includes(option)) {
      this.option.setErrors({
        duplicate: true
      });

      return;
    }

    this.options.push(option);
    this.option.reset();
  }

  removeOption(index: number) {
    this.options.splice(index, 1);
  }

  triggerAddItem() {
    if (this.isMaxQuestion) {
      this.toastService.error('Exceeded the maximum number of Questions that can be created (10)');
      return;
    }

    const { type, label } = this.form.controls;

    if (type.value === DEFAULT_SUPPORTED_TYPE.Option && !this.options.length) {
      this.option.markAllAsTouched();
      this.option.setErrors({
        empty: true
      });

      return;
    }

    const item: Item = {
      label: label.value,
      type: type.value,
      options: this.options
    };

    this.addItem.emit(item);
    this.reset();
  }

  reset() {
    this._item = null;
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.form.patchValue({
      label: '',
      type: this.types.Number,
      option: ''
    });
  }

  cancel() {
    this.addItem.emit(null);
    this.reset();
  }

  closeStoreItem() {
    this.closed.emit(false);
  }

  get option() {
    return this.form.controls['option'];
  }
}
