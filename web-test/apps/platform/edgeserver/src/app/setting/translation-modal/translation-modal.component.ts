import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PreConfig, TranslationProfile, TranslationService } from '@b3networks/api/edgeserver';
import { finalize } from 'rxjs/operators';

export interface TranslationModalInput {
  isEdit: boolean;
  translation: TranslationProfile;
  translations: TranslationProfile[];
  preConfig: PreConfig;
  cluster: string;
}

@Component({
  selector: 'b3n-translation-modal',
  templateUrl: './translation-modal.component.html',
  styleUrls: ['./translation-modal.component.scss']
})
export class TranslationModalComponent implements OnInit {
  formGroup: UntypedFormGroup;
  isLoading: boolean;
  translationModalInput: TranslationModalInput;

  get name() {
    return this.formGroup.get('name');
  }

  get pattern() {
    return this.formGroup.get('pattern');
  }

  get replacement() {
    return this.formGroup.get('replacement');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: TranslationModalInput,
    private fb: UntypedFormBuilder,
    private translationService: TranslationService,
    private dialogRef: MatDialogRef<TranslationModalComponent>
  ) {
    this.translationModalInput = this.data;
    this.initForm();
  }

  ngOnInit(): void {}

  onSave() {
    if (this.formGroup.invalid) {
      return;
    }

    const request: TranslationProfile = {
      name: this.name.value,
      pattern: this.pattern.value,
      replacement: this.replacement.value
    };

    if (this.translationModalInput?.isEdit) {
      this.updateTranslationProfile(request);
      return;
    }
    this.createTranslationrofile(request);
  }

  private createTranslationrofile(request: TranslationProfile) {
    this.isLoading = true;
    this.translationService
      .createTranslationProfile(request, this.translationModalInput.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.dialogRef.close({ success: true });
        },
        error => {
          this.dialogRef.close({ success: false, error });
        }
      );
  }

  private updateTranslationProfile(request: TranslationProfile) {
    this.isLoading = true;
    this.translationService
      .updateTranslationProfile(request, this.translationModalInput.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.dialogRef.close({ success: true });
        },
        error => {
          this.dialogRef.close({ success: false, error });
        }
      );
  }

  private initForm() {
    const { isEdit, translation, preConfig } = this.translationModalInput;
    if (isEdit) {
      this.formGroup = this.fb.group({
        name: [
          { value: translation?.name, disabled: true },
          [
            Validators.required,
            Validators.pattern(preConfig?.pattern?.name),
            this.checkExistsTranslationValidator.bind(this)
          ]
        ],
        pattern: [translation?.pattern, Validators.required],
        replacement: [translation?.replacement, Validators.required]
      });
      return;
    }
    this.formGroup = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(preConfig?.pattern?.name),
          this.checkExistsTranslationValidator.bind(this)
        ]
      ],
      pattern: ['', Validators.required],
      replacement: ['', Validators.required]
    });
  }

  private checkExistsTranslationValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const { translations } = this.translationModalInput;

    let namesTranslation = [];
    if (translations?.length) {
      namesTranslation = translations.map(translation => translation.name);
    }

    if (namesTranslation.indexOf(control.value?.toString()) > -1) {
      return { isExistsTranslation: true };
    }
    return null;
  }
}
