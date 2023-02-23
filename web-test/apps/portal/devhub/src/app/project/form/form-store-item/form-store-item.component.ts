import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Item } from '@b3networks/api/data';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { takeUntil, tap } from 'rxjs/operators';

export enum ItemType {
  Text = 'text',
  Textarea = 'textarea',
  Number = 'number',
  Option = 'options'
}

@Component({
  selector: 'b3n-form-store-item',
  templateUrl: './form-store-item.component.html',
  styleUrls: ['./form-store-item.component.scss']
})
export class FormStoreItemComponent extends DestroySubscriberComponent implements OnInit {
  private _item: Item;

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

  @Output() addItem = new EventEmitter<Item>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() close = new EventEmitter<boolean>();

  types = ItemType;
  form: UntypedFormGroup;
  showOption: boolean;
  options: string[] = [];

  constructor(private fb: UntypedFormBuilder) {
    super();
  }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      label: ['', Validators.required],
      type: [this.types.Number, Validators.required],
      option: ''
    });

    this.form.controls['type'].valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(type => {
          this.option.reset();
          this.options = [];
          this.showOption = type === ItemType.Option;
        })
      )
      .subscribe();
  }

  addOption() {
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
    const { type, label } = this.form.controls;

    if (type.value === ItemType.Option && !this.options.length) {
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
    this.close.emit(false);
  }

  get option() {
    return this.form.controls['option'];
  }
}
