import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Item, NoteService, NoteTemplate } from '@b3networks/api/data';
import { generateUUID } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { ItemType } from '../form-store-item/form-store-item.component';

export interface StoreFormInput {
  noteTemplate?: NoteTemplate;
}

@Component({
  selector: 'b3n-form-store',
  templateUrl: './form-store.component.html',
  styleUrls: ['./form-store.component.scss']
})
export class FormStoreComponent implements OnInit {
  items: Item[] = [];
  item: Item;
  ItemType = ItemType;

  isUpdate: boolean;
  adding: boolean;
  showStoreItem: boolean;

  form: UntypedFormGroup;
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: StoreFormInput,
    private dialogRef: MatDialogRef<FormStoreComponent>,
    private toastService: ToastService,
    private noteService: NoteService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.isUpdate = this.data.noteTemplate instanceof Object;
    if (this.isUpdate) {
      this.form = this.fb.group({
        title: [this.data.noteTemplate.title],
        module: 'flow'
      });
      this.noteService.getNoteTemplate(this.data.noteTemplate.templateUuid).subscribe(noteTemplate => {
        this.items = noteTemplate.items;
      });
    } else {
      this.form = this.fb.group({
        title: ['', Validators.required],
        module: 'flow'
      });
    }

    this.triggerStoreItem(true);
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
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }

  triggerStoreItem(show: boolean, item?: Item) {
    this.item = item;
    this.showStoreItem = show;
  }

  updateOrCreate() {
    this.adding = true;
    const { title, module } = this.form.controls;

    if (!this.items.length) {
      title.setErrors({
        empty: true
      });
      title.markAsTouched();

      return;
    }

    const noteTemplate: Partial<NoteTemplate> = {
      title: title.value,
      module: module.value,
      items: this.items
    };
    if (this.isUpdate) {
    } else {
      const uuid = generateUUID();

      this.noteService
        .createNoteTemplate(uuid, noteTemplate)
        .subscribe(
          res => {
            this.toastService.success('Add template successfully');
            this.dialogRef.close(noteTemplate);
          },
          err => this.toastService.warning(err.message)
        )
        .add(() => (this.adding = false));
    }
  }

  get title() {
    return this.form.controls['title'];
  }
}
