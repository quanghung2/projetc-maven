import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { AfterContentChecked, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatSelectChange } from '@angular/material/select';
import {
  BodyParameter,
  ConditionVisibilityDep,
  DataSourceForSubroutine,
  DataSourceService,
  Flow,
  FlowQuery,
  RegexValidation,
  RenderDirective,
  RenderDirectiveType,
  VisibilityDep
} from '@b3networks/api/flow';
import { AppName, AppStateQuery, Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { startWith } from 'rxjs/operators';

@Component({
  template: ''
})
export class SharedInputParamComponent implements OnInit, AfterContentChecked {
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly renderDirectiveType = RenderDirectiveType;

  showForApp: string;
  AppName = AppName;

  flow: Flow;
  dataSources: DataSourceForSubroutine[];

  getErrorInput = (ctrl: UntypedFormControl | AbstractControl) => Utils.getErrorInput(ctrl);

  constructor(
    protected fb: UntypedFormBuilder,
    protected dataSourceService: DataSourceService,
    private cdr: ChangeDetectorRef,
    private appStateQuery: AppStateQuery,
    private flowQuery: FlowQuery
  ) {}

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();
    this.flow = this.flowQuery.getValue();

    if (this.showForApp === AppName.PROGRAMMABLE_FLOW) {
      this.dataSources = [];
    } else {
      this.dataSourceService.getDataSources().subscribe(res => {
        this.dataSources = res.sort((a, b) => a.displayText.localeCompare(b.displayText));
      });
    }
  }

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  private setDataTypeFake(b: BodyParameter) {
    if (b.renderDirective) {
      if (b.renderDirective.type === RenderDirectiveType.File) {
        return 'file';
      }
      if (b.dataType !== 'array') {
        return b.renderDirective.valueListUuid;
      }
    }

    if (b.arrayItemDataType && this.flow.type === 'SUBROUTINE') {
      return `array-${b.arrayItemDataType}`;
    }

    return b.dataType;
  }

  private createFormConditionVisibilityDep(cvd: ConditionVisibilityDep[]): UntypedFormArray {
    const conditions = this.fb.array([]);
    cvd.forEach(item => {
      conditions.push(
        this.fb.group({
          key: [item.key, Validators.required],
          values: [item.values, Validators.required]
        })
      );
    });
    return conditions;
  }

  private createFormVisibilityDep(vd?: VisibilityDep): UntypedFormGroup {
    if (vd) {
      return this.fb.group({
        conditions: this.createFormConditionVisibilityDep(vd.conditions),
        requiredWhenShow: vd.requiredWhenShow
      });
    }
    return this.fb.group({
      conditions: this.fb.array([]),
      requiredWhenShow: false
    });
  }

  private createFormRenderDirective(rd: RenderDirective): UntypedFormGroup {
    if (rd) {
      return this.fb.group({
        type: rd.type,
        supportedMimeTypes: [rd.supportedMimeTypes ?? []],
        valueListUuid: rd.valueListUuid
      });
    }
    return null;
  }

  private createFormCustomRegexValidation(rv: RegexValidation): UntypedFormGroup {
    let form: UntypedFormGroup;
    if (rv) {
      form = this.fb.group({
        pattern: [
          rv.pattern,
          Utils.validateInput({
            required: false,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.REGEX_PATTERN
          })
        ],
        description: [
          rv.description,
          Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
        ]
      });
    } else {
      form = this.fb.group({
        pattern: [
          '',
          Utils.validateInput({
            required: false,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.REGEX_PATTERN
          })
        ],
        description: [
          '',
          Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
        ]
      });
    }

    form
      .get('pattern')
      .valueChanges.pipe(startWith(rv?.pattern))
      .subscribe(pattern => {
        if (!pattern) {
          form.get('description').disable();
        } else {
          form.get('description').enable();
        }
      });

    return form;
  }

  add(form: UntypedFormGroup, event: MatChipInputEvent): void {
    const input = event.chipInput.inputElement;
    const value = event.value.trim();

    if (value) {
      form.get('renderDirective.supportedMimeTypes').value.push(value);
    }

    if (input) {
      input.value = '';
    }
  }

  remove(form: UntypedFormGroup, index: number): void {
    const items = form.get('renderDirective.supportedMimeTypes').value.filter((_, idx) => idx !== index);
    form.get('renderDirective.supportedMimeTypes').setValue(items);
  }

  createForms(body: BodyParameter[]): UntypedFormArray {
    const forms = this.fb.array([]);
    body.forEach(p => {
      const form = this.fb.group({
        key: p.key,
        title: [
          p.title,
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ],
        dataType: [p.dataType, Validators.required],
        dataTypeFake: this.setDataTypeFake(p),
        arrayItemDataType: p.arrayItemDataType,
        description: p.description,
        hidden: p.hidden,
        require: !p.isOptional,
        isOptional: p.isOptional,
        renderDirective: this.createFormRenderDirective(p.renderDirective),
        visibilityDep: this.createFormVisibilityDep(p.visibilityDep),
        customRegexValidation: this.createFormCustomRegexValidation(p.customRegexValidation)
      });
      form.get('title').valueChanges.subscribe(val => {
        const key = val.replace(/@/g, '').replace(/'/g, '');
        form.get('key').setValue(key);
      });
      if (p.visibilityDep?.conditions.length > 0) {
        form.get('require').setValue(false);
        form.get('isOptional').setValue(true);
      }
      forms.push(form);
    });
    return forms;
  }

  initForm(): UntypedFormGroup {
    const form = this.fb.group({
      key: '',
      title: [
        '',
        Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
      ],
      dataType: ['', Validators.required],
      dataTypeFake: ['', Validators.required],
      arrayItemDataType: ['', Validators.required],
      description: '',
      hidden: false,
      require: true,
      isOptional: false,
      visibilityDep: this.createFormVisibilityDep(),
      customRegexValidation: this.createFormCustomRegexValidation(null)
    });
    form.get('title').valueChanges.subscribe(val => {
      const key = val.replace(/@/g, '').replace(/'/g, '');
      form.get('key').setValue(key);
    });
    return form;
  }

  changeDataType(event: MatSelectChange, form: UntypedFormGroup) {
    form.removeControl('arrayItemDataType');
    form.removeControl('renderDirective');
    form.removeControl('customRegexValidation');
    const dataSource = this.dataSources.find(i => i.uuid === event.value);
    if (dataSource) {
      form.get('dataType').setValue(dataSource.valueDataType);
      form.addControl(
        'renderDirective',
        this.createFormRenderDirective({ type: RenderDirectiveType.SingleSelect, valueListUuid: dataSource.uuid })
      );
    } else {
      form.get('dataType').setValue(event.value);
      switch (event.value) {
        case 'string':
        case 'number':
          form.setControl('customRegexValidation', this.createFormCustomRegexValidation(null));
          break;
        case 'array':
          form.setControl('arrayItemDataType', new UntypedFormControl('string'));
          form.setControl('customRegexValidation', this.createFormCustomRegexValidation(null));
          break;
        case 'array-string':
          form.get('dataType').setValue('array');
          form.setControl('arrayItemDataType', new UntypedFormControl('string'));
          break;
        case 'array-number':
          form.get('dataType').setValue('array');
          form.setControl('arrayItemDataType', new UntypedFormControl('number'));
          break;
        case 'file':
          form.get('dataType').setValue('string');
          form.setControl(
            'renderDirective',
            this.createFormRenderDirective({ type: RenderDirectiveType.File, valueListUuid: null })
          );
          break;
      }
    }
  }
}
