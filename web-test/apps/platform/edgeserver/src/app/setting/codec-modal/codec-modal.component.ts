import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CodecProfile, CodecService, PreConfig } from '@b3networks/api/edgeserver';
import { finalize } from 'rxjs/operators';

export interface CodecModalInput {
  isEdit: boolean;
  codec: CodecProfile;
  codecs: CodecProfile[];
  preConfig: PreConfig;
  cluster: string;
}

@Component({
  selector: 'b3n-codec-modal',
  templateUrl: './codec-modal.component.html',
  styleUrls: ['./codec-modal.component.scss']
})
export class CodecModalComponent implements OnInit {
  formGroup: UntypedFormGroup;
  isLoading: boolean;
  codecsSource: string[] = [];
  selectedDropCodecs: string[] = [];
  codecModalInput: CodecModalInput;

  get codecs() {
    return this.formGroup.get('codecs');
  }

  get name() {
    return this.formGroup.get('name');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: CodecModalInput,
    private fb: UntypedFormBuilder,
    private codecService: CodecService,
    private dialogRef: MatDialogRef<CodecModalComponent>
  ) {
    this.codecModalInput = this.data;
    this.codecsSource = [...this.data?.preConfig?.codecs];
    this.initForm();
  }

  ngOnInit(): void {}

  onSave() {
    if (this.formGroup.invalid || !this.selectedDropCodecs.length) {
      return;
    }

    const request: CodecProfile = {
      name: this.name.value,
      codecs: this.selectedDropCodecs
    };

    if (this.codecModalInput?.isEdit) {
      this.updateCodecProfile(request);
      return;
    }
    this.createCodecProfile(request);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  private updateCodecProfile(request: CodecProfile) {
    this.isLoading = true;
    this.codecService
      .updateCodecProfile(request, this.codecModalInput.cluster)
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

  private createCodecProfile(request: CodecProfile) {
    this.isLoading = true;
    this.codecService
      .createCodecProfile(request, this.codecModalInput.cluster)
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
    const { isEdit, preConfig, codec } = this.codecModalInput;
    if (isEdit) {
      this.selectedDropCodecs = [...this.data.codec?.codecs];
      this.initCodecsData();

      this.formGroup = this.fb.group({
        name: [
          { value: codec?.name, disabled: true },
          [Validators.required, Validators.pattern(preConfig?.pattern?.name), this.checkExistsCodecValidator.bind(this)]
        ]
      });
      return;
    }
    this.selectedDropCodecs = [preConfig?.codecs[0]];
    this.initCodecsData();
    this.formGroup = this.fb.group({
      name: [
        '',
        [Validators.required, Validators.pattern(preConfig?.pattern?.name), this.checkExistsCodecValidator.bind(this)]
      ]
    });
  }

  cancel() {
    console.log(this.name.value);
  }

  private initCodecsData() {
    if (this.codecsSource.length) {
      const codecsOrigin = [...this.codecsSource];
      codecsOrigin.forEach(element => {
        if (this.selectedDropCodecs.indexOf(element) > -1) {
          this.codecsSource.splice(this.codecsSource.indexOf(element), 1);
        }
      });
    }
  }

  private checkExistsCodecValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const { codecs } = this.codecModalInput;

    let namesCodec = [];
    if (codecs?.length) {
      namesCodec = codecs.map(codec => codec.name);
    }

    if (namesCodec.indexOf(control.value?.toString()) > -1) {
      return { isExistsCodec: true };
    }
    return null;
  }
}
