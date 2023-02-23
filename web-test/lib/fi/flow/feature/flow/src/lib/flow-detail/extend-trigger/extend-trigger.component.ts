import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ExtendOutput, Trigger, TriggerQuery, UtilsService } from '@b3networks/api/flow';
import { Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-extend-trigger',
  templateUrl: './extend-trigger.component.html',
  styleUrls: ['./extend-trigger.component.scss']
})
export class ExtendTriggerComponent implements OnInit {
  @Input() editable: boolean;

  trigger: Trigger;
  extracting: boolean;

  modeExtendCtrl = new UntypedFormControl();
  formOutputBasic = new UntypedFormArray([]);
  formOutputAdvanced = new UntypedFormArray([]);

  templateJsonCtrl = new UntypedFormControl(
    null,
    Utils.validateInput({
      maxlength: ValidateStringMaxLength.EXTRACT_RESPONSE,
      dataType: 'string',
      required: false
    })
  );
  getErrorTemplateJsonCtrl() {
    const textErr = Utils.getErrorInput(this.templateJsonCtrl);
    return textErr ? textErr : this.templateJsonCtrl.hasError('invalid') ? 'Template is invalid' : '';
  }

  getErrorField(form: UntypedFormGroup) {
    const textErr = Utils.getErrorInput(form.get('field'));
    return textErr ? textErr : form.get('field').hasError('duplicate') ? 'Field name is already exists' : '';
  }

  constructor(
    private fb: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private triggerQuery: TriggerQuery,
    private utilsService: UtilsService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.trigger = this.triggerQuery.getValue();

    this.modeExtendCtrl.valueChanges.subscribe(mode => {
      if (mode === 'ADVANCED') {
        this.formOutputAdvanced.setValidators(Validators.required);
      } else {
        this.formOutputAdvanced.setValidators(null);
      }
      this.cdr.detectChanges();
    });

    if (this.trigger.extensionConfig.mode && this.trigger.outputs.extended) {
      this.initOutput();
      this.modeExtendCtrl.setValue(this.trigger.extensionConfig.mode);
    } else {
      this.modeExtendCtrl.setValue('BASIC');
    }

    if (!this.editable) {
      this.formOutputBasic.disable();
      this.formOutputAdvanced.disable();
      this.modeExtendCtrl.disable();
    }
  }

  addOutput(formOutput: UntypedFormArray, output?) {
    let form: UntypedFormGroup;

    if (output) {
      form = this.fb.group({
        field: [
          output.field ?? output.title,
          Utils.validateInput({
            maxlength: ValidateStringMaxLength.NAME_TITLE,
            dataType: 'string',
            required: true
          })
        ],
        dataType: [output.dataType, Validators.required]
      });

      if (output.dataType === 'array') {
        const arrayItemProps = this.fb.array([]);
        output.arrayItemProps.forEach(i => {
          this.addOutput(arrayItemProps, i);
        });
        form.addControl('arrayItemProps', arrayItemProps);
        form.addControl('arrayItemDataType', this.fb.control(output.arrayItemDataType));
      }
    } else {
      form = this.fb.group({
        field: [
          '',
          Utils.validateInput({
            maxlength: ValidateStringMaxLength.NAME_TITLE,
            dataType: 'string',
            required: true
          })
        ],
        dataType: ['', Validators.required]
      });
    }

    form.get('field').valueChanges.subscribe(field => {
      if (formOutput.value.filter(i => i.field === field).length > 0) {
        form.get('field').setErrors({ duplicate: true });
      } else {
        form.get('field').setErrors({ duplicate: null });
        form.get('field').updateValueAndValidity({ emitEvent: false });
      }
    });

    if (!this.editable) {
      form.disable();
    }
    formOutput.push(form);
  }

  removeOutput(formArray: UntypedFormArray, index: number) {
    formArray.removeAt(index);
  }

  removeSubOutput(formArray: UntypedFormArray, i: number, formSubArray: UntypedFormArray, j: number) {
    formSubArray.removeAt(j);
    if (formSubArray.controls.length == 0) {
      this.removeOutput(formArray, i);
    }
  }

  private disableDatatype() {
    this.formOutputAdvanced.controls.forEach(form => {
      form.get('dataType').disable();
      if (form.get('dataType').value === 'array') {
        const arrayItemProps = form.get('arrayItemProps') as UntypedFormArray;
        arrayItemProps.controls.forEach(subform => {
          subform.get('dataType').disable();
        });
      }
    });
  }

  extractJsonProps() {
    if (Utils.checkJson(this.templateJsonCtrl.value)) {
      this.extracting = true;
      this.utilsService
        .extractExtendTriggerOutput(this.templateJsonCtrl.value)
        .pipe(finalize(() => (this.extracting = false)))
        .subscribe(
          res => {
            this.formOutputAdvanced.clear();
            res.forEach(i => {
              this.addOutput(this.formOutputAdvanced, <ExtendOutput>{
                field: i.field,
                dataType: i.dataType,
                arrayItemDataType: i.arrayItemDataType,
                arrayItemProps: i.arrayItemProps
              });
            });
            this.disableDatatype();
          },
          error => {
            this.templateJsonCtrl.setErrors({ invalid: true });
            this.toastService.error(error.message);
          }
        );
    } else {
      this.templateJsonCtrl.setErrors({ invalid: true });
    }
  }

  private initOutput() {
    this.trigger.outputs.extended.forEach(i => {
      this.addOutput(this.trigger.extensionConfig.mode === 'BASIC' ? this.formOutputBasic : this.formOutputAdvanced, <
        ExtendOutput
      >{
        field: i.title,
        dataType: i.dataType,
        arrayItemDataType: i.arrayItemDataType,
        arrayItemProps: i.arrayItemProps
      });
    });
    this.disableDatatype();
  }
}
