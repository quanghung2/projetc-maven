import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Item, NoteService, NoteTemplate, TemplateModule } from '@b3networks/api/data';
import { generateUUID, MyErrorStateMatcher } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { DEFAULT_SUPPORTED_TYPE } from '../store-item/store-item.component';

@Component({
  selector: 'b3n-store-note-template',
  templateUrl: './store-note-template.component.html',
  styleUrls: ['./store-note-template.component.scss']
})
export class StoreNoteTemplateComponent implements OnInit {
  private _noteTemplate: NoteTemplate;

  @Input() module: TemplateModule;
  @Input() set noteTemplate(value: NoteTemplate) {
    this._noteTemplate = value;
    this.items = value?.items || [];
  }

  get noteTemplate(): NoteTemplate {
    return this._noteTemplate;
  }

  @Input() isMaxTemplate: boolean;
  @Output() resetScreen = new EventEmitter<any>();
  @Output() toggleNoteTemplateForm = new EventEmitter<any>();

  items: Item[] = [];
  item: Item;
  ItemType = DEFAULT_SUPPORTED_TYPE;
  matcher = new MyErrorStateMatcher();
  form: UntypedFormGroup;
  adding: boolean;
  showStoreItem: boolean;

  constructor(
    public dialog: MatDialog,
    private fb: UntypedFormBuilder,
    private noteService: NoteService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    if (this.noteTemplate) {
      this.items = this.noteTemplate.items;
    }

    this.initForm();
    this.triggerStoreItem(true);
  }

  initForm() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(128)]],
      module: this.module || 'callcenter'
    });
  }

  addItem(item: Item) {
    this.item = null;

    if (!item) {
      return;
    }

    const exist = this.items.findIndex(i => i.label === item.label);

    if (exist > -1) {
      this.items.splice(exist, 1, item);
    } else {
      this.items.push(item);
    }

    this.title.setErrors(null);

    if (!this.title.value) {
      this.title.setErrors({ required: true });
    }

    if (this.title.value.length > 128) {
      this.title.setErrors({ maxlength: { requiredLength: 128, actualLength: this.title.value.length } });
    }
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }

  addNoteTemplate() {
    if (this.isMaxTemplate) {
      this.toastService.error('Exceeded the maximum number of Templates that can be created (100)');
      return;
    }

    const { title, module } = this.form.controls;

    if (!this.items.length) {
      title.setErrors({
        empty: true
      });
      title.markAsTouched();

      return;
    }

    this.adding = true;

    const uuid = generateUUID();
    const noteTemplate: Partial<NoteTemplate> = {
      title: title.value,
      module: module.value,
      items: this.items
    };

    this.noteService
      .createNoteTemplate(uuid, noteTemplate)
      .subscribe(
        _ => {
          this.toastService.success('Add template successfully');
          this.resetScreen.emit(module.value);
        },
        err => this.toastService.warning(err.message)
      )
      .add(() => (this.adding = false));
  }

  triggerStoreItem(show: boolean, item?: Item) {
    this.item = item;
    this.showStoreItem = show;
  }

  back() {
    this.toggleNoteTemplateForm.emit();
  }

  get title() {
    return this.form.controls['title'];
  }
}
