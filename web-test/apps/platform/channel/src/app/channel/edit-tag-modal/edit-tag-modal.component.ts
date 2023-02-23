import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DefaultTagService, WalletService } from '@b3networks/api/billing';
import { HashMap } from '@datorama/akita';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface EditTagInput {
  parnerUuid: string;
  buyerTag: HashMap<string>;
}

@Component({
  selector: 'b3n-edit-tag-modal',
  templateUrl: './edit-tag-modal.component.html',
  styleUrls: ['./edit-tag-modal.component.scss']
})
export class EditTagModalComponent implements OnInit {
  buyerTag: HashMap<string>;
  parnerUuid: string;
  filteredTags: Observable<string[]>;

  formGroup: UntypedFormGroup;
  progressing: boolean;
  defaultKeys: string[] = [];

  get tags(): UntypedFormArray {
    return this.formGroup.get('tags') as UntypedFormArray;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) data: EditTagInput,
    private dialogRef: MatDialogRef<EditTagModalComponent>,
    private walletService: WalletService,
    private fb: UntypedFormBuilder,
    private defaultTagService: DefaultTagService
  ) {
    this.buyerTag = data.buyerTag;
    this.parnerUuid = data.parnerUuid;
  }

  ngOnInit(): void {
    this.initForm();
  }

  onAddTag() {
    const controls: UntypedFormGroup = this.fb.group({
      key: ['', Validators.required],
      value: ['', Validators.required]
    });

    this.tags.push(controls);
  }

  onSave() {
    const buyerTags = {};
    const items = this.tags.value?.filter(item => item.key.length || item.value.length) as Array<any>;
    items.forEach(item => {
      buyerTags[item.key] = item.value;
    });

    this.progressing = true;
    this.walletService
      .putBuyerTag(this.parnerUuid, buyerTags)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close({ success: true });
        },
        _ => {
          this.dialogRef.close({ success: false });
        }
      );
  }

  onChangeValue(form: UntypedFormGroup) {
    form.get('key').setValue(form.get('key').value.trim());
    form.get('value').setValue(form.get('value').value.trim());
  }

  deleteTag(index: number) {
    (this.formGroup.controls['tags'] as UntypedFormArray).removeAt(index);
  }

  private initForm() {
    const form: UntypedFormGroup[] = [];
    const keyTags = Object.keys(this.buyerTag);
    if (keyTags.length) {
      keyTags.forEach(keyTag => {
        const formG: UntypedFormGroup = this.fb.group({
          key: [keyTag],
          value: [this.buyerTag[keyTag]]
        });

        form.push(formG);
      });
    } else {
      const formG: UntypedFormGroup = this.fb.group({
        key: [''],
        value: ['']
      });
      form.push(formG);
    }

    this.defaultTagService.getDefaultTag().subscribe(defaultKeys => {
      this.defaultKeys = defaultKeys.defaultKeys;
    });

    this.formGroup = this.fb.group({
      tags: this.fb.array(form)
    });
  }
}
