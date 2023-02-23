import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { ErrorStateMatcher, MAT_DATE_FORMATS } from '@angular/material/core';
import { FileService, S3Service, Status, UploadEvent } from '@b3networks/api/file';
import { EnumTypeInput, FieldContact, LabelValue } from '@b3networks/api/integration';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format } from 'date-fns';
import { takeUntil } from 'rxjs/operators';

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL'
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}

@Component({
  selector: 'b3n-dynamic-input',
  templateUrl: './dynamic-input.component.html',
  styleUrls: ['./dynamic-input.component.scss'],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }]
})
export class DynamicInputComponent extends DestroySubscriberComponent implements OnInit {
  @Input() prop: FieldContact;
  @Input() isViewing: boolean;

  readonly EnumTypeInput = EnumTypeInput;

  control: any;
  dateInput = MY_FORMATS.display.dateInput;
  matcher = new MyErrorStateMatcher();

  // for uploadfile
  backgroundUploading = false;
  backgroundUploadProgress = 0;
  urlFileS3: string;

  constructor(
    private fb: UntypedFormBuilder,
    private s3Service: S3Service,
    private toastService: ToastService,
    private fileService: FileService
  ) {
    super();
  }

  ngOnInit() {
    if (this.prop.type === EnumTypeInput.Checkbox) {
      this.control = this.fb.array([]) as UntypedFormArray;
      const arrValue = this.prop?.value ? (<string>this.prop?.value).split(';') : [];
      this.prop.options.forEach(item => {
        const check = arrValue.some(x => x === item.value);
        (<UntypedFormArray>this.control).push(this.fb.control(check));
      });
    } else if (this.prop.type === EnumTypeInput.Booleancheckbox) {
      this.control = this.fb.control('') as UntypedFormControl;
      this.control.setValue(this.prop.value === 'true');
    } else if (this.prop.type === EnumTypeInput.Date) {
      this.control = this.fb.control('') as UntypedFormControl;
      if (this.prop.value !== undefined) {
        const time = format(new Date(this.prop.value as string), 'yyyy-MM-dd');
        if (this.prop.required) {
          (<UntypedFormControl>this.control).setValidators([Validators.required]);
        }
        this.control.setValue(time);
      }
    } else if (this.prop.type === EnumTypeInput.Nested_select) {
      this.control = this.fb.array([]);
      const group = this.fb.group({
        name: this.prop.name,
        label: this.prop.label,
        value: null,
        type: this.prop.type,
        required: this.prop.required,
        options: this.addOptionsControl(this.prop.options),
        level: 1
      } as FieldContact);
      if (this.prop.required) {
        group.get('value').setValidators([Validators.required]);
      }
      // push parent control with level 1
      (<UntypedFormArray>this.control).push(group);
    } else {
      this.control = this.fb.control('') as UntypedFormControl;
      if (this.prop.required) {
        (<UntypedFormControl>this.control).setValidators([Validators.required]);
      }
      this.control.setValue(this.prop.value);
    }

    this.checkDisabledField();

    // save data @input()
    this.control.valueChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe(value => {
      if (this.prop.type === EnumTypeInput.Nested_select) {
        this.prop.value = value;
      } else if (this.prop.type === EnumTypeInput.Checkbox) {
        const arrCheckbox = [];
        value.forEach((x, i) => {
          if (x === true) {
            arrCheckbox.push(this.prop.options[i].value);
          }
        });
        this.prop.value = arrCheckbox.join(';');
      } else if (this.prop.type === EnumTypeInput.Booleancheckbox) {
        this.prop.value = value ? 'true' : 'false';
      } else if (this.prop.type === EnumTypeInput.Date) {
        this.prop.value = format(new Date(value), 'yyyy-MM-dd');
      } else {
        if (value === '') {
          this.prop.value = null;
        } else {
          this.prop.value = value;
        }
      }
    });
  }

  onBackgroundFileChange(event) {
    if (event.target.files.length > 0) {
      // clear file
      this.urlFileS3 = undefined;
      this.backgroundUploading = true;
      const file = event.target.files[0];

      let uploadEvent = <UploadEvent>{ status: Status.NONE, percentage: 0 };
      this.s3Service.generalUpload(file, 'communication/tts').subscribe(
        res => {
          uploadEvent = res;
          if (uploadEvent.status === Status.PROCESSING || uploadEvent.status === Status.COMPLETED) {
            this.backgroundUploadProgress = uploadEvent.percentage;
          } else if (uploadEvent.status === Status.CANCELED) {
            this.toastService.error('Update canceled.');
            this.backgroundUploading = false;
          }

          if (uploadEvent.status === Status.COMPLETED) {
            const url = res.keyForSignApi;
            this.getDownloadableUrl(url);
            this.toastService.success('Upload successfully');
          }
        },
        () => {
          this.toastService.error('Error! Can not upload file.');
          this.backgroundUploading = false;
        }
      );
    }
  }

  selectionChange($event) {
    const form = $event.value as FieldContact;
    if (form.value) {
      this.addMoreSelect(form.options, form.value as string, form.level);
    }
  }

  private addMoreSelect(options: LabelValue[], key: string, level: number) {
    // map list control with level > current level to remove this children control
    const listRemoveControl = this.control.getRawValue().map(x => x.level > level && x.level > 1);
    // remove children control because selected parent
    for (let i = listRemoveControl.length - 1; i >= 0; i--) {
      if (listRemoveControl[i]) {
        this.control.removeAt(i);
      }
    }

    const item = options.find(x => x.value === key);
    if (item && item.options && item.options.length > 0) {
      const nextLevel = level + 1;
      const dependProperty = this.prop.dependentProperties.find(x => x.level === nextLevel);
      const group = this.fb.group({
        name: dependProperty.name,
        label: dependProperty.label,
        value: null,
        type: this.prop.type,
        required: this.prop.required,
        options: this.addOptionsControl(item.options),
        level: nextLevel
      } as FieldContact);
      if (this.prop.required) {
        group.get('value').setValidators([Validators.required]);
      }
      (<UntypedFormArray>this.control).push(group);
    }
  }

  private addOptionsControl(options: LabelValue[]): UntypedFormArray {
    if (options && options.length > 0) {
      const array: UntypedFormArray = this.fb.array([]);
      options.forEach(item => {
        array.push(
          this.fb.group({
            label: item.label,
            value: item.value,
            // recursion
            options: this.addOptionsControl(item.options)
          })
        );
      });
      return array;
    }
    return null;
  }

  private checkDisabledField() {
    if (this.isViewing) {
      if (this.prop.type === EnumTypeInput.Checkbox || this.prop.type === EnumTypeInput.Booleancheckbox) {
        this.control.disable();
      }
    }
  }

  private getDownloadableUrl(key: string) {
    this.fileService.getDownloadFileUrl(key).subscribe(fileUrl => {
      this.urlFileS3 = fileUrl.url;
      this.backgroundUploading = false;
    });
  }
}
