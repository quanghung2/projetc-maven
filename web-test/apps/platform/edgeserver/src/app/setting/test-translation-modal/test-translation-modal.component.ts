import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TestTranslationProfile, TranslationService } from '@b3networks/api/edgeserver';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface TestTranslationModalInput {
  name: string;
  cluster: string;
}

@Component({
  selector: 'b3n-test-translation-modal',
  templateUrl: './test-translation-modal.component.html',
  styleUrls: ['./test-translation-modal.component.scss']
})
export class TestTranslationModalComponent implements OnInit {
  name: string;
  number = new UntypedFormControl('', Validators.required);
  isLoading: boolean;

  translationProfile: TestTranslationProfile;
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: TestTranslationModalInput,
    private translationService: TranslationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.name = this.data?.name;
  }

  onTestTranslation() {
    if (this.number.invalid) {
      return;
    }
    this.isLoading = true;
    this.translationService
      .testTranslationProfile(this.name, this.number.value?.toString(), this.data.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.translationProfile = res;
        },
        error => {
          this.toastService.error(error);
        }
      );
  }
}
