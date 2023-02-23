import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { AfterContentChecked, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup
} from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatSelectChange } from '@angular/material/select';
import { AuthorDataSource, AuthorDataSourceQuery, RenderDirectiveType, VariableForAction } from '@b3networks/api/flow';
import { Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { Observable } from 'rxjs';

@Component({
  selector: 'b3n-fill-parameters',
  templateUrl: './fill-parameters.component.html',
  styleUrls: ['./fill-parameters.component.scss']
})
export class FillParametersComponent implements OnInit, AfterContentChecked {
  @Input() title: string;
  @Input() group: UntypedFormGroup;
  @Input() key: string;
  @Input() isBody: boolean;
  @Input() nested: boolean;
  @Input() contextVariables: VariableForAction[];
  @Input() type: string;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly renderDirectiveType = RenderDirectiveType;
  authorDataSources$: Observable<AuthorDataSource[]>;

  getErrorInput(ctrl: UntypedFormControl | AbstractControl) {
    return Utils.getErrorInput(ctrl);
  }

  get parameters(): UntypedFormArray {
    return this.group.get(this.key) as UntypedFormArray;
  }

  constructor(
    private fb: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private dataSourceQuery: AuthorDataSourceQuery
  ) {}

  ngOnInit(): void {
    this.authorDataSources$ = this.dataSourceQuery.selectAll();
  }

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  onChangeDataType(event: MatSelectChange, item: UntypedFormGroup) {
    item.removeControl('arrayItemDataType');
    item.removeControl('arrayItemDataTypeFake');
    item.removeControl('arrItemUniqueAcrossTriggers');
    item.removeControl('renderDirective');
    item.removeControl('customRegexValidation');
    item.get('defaultValueTree').setValue(null);

    const authorDataSource = this.dataSourceQuery.getEntity(event.value);
    if (authorDataSource) {
      item.get('dataType').setValue(authorDataSource.valueDataType);
      item.setControl(
        'renderDirective',
        this.createFormRenderDirective(RenderDirectiveType.SingleSelect, authorDataSource.uuid)
      );
    } else {
      item.get('dataType').setValue(event.value);
      switch (event.value) {
        case 'string':
        case 'number':
          item.setControl('customRegexValidation', this.createFormCustomRegexValidation());
          break;
        case 'boolean':
          item.get('defaultValueTree').setValue({ type: 'value - boolean', value: false });
          break;
        case 'array':
          item.setControl('arrayItemDataType', new UntypedFormControl('string'));
          item.setControl('arrayItemDataTypeFake', new UntypedFormControl('string'));
          item.setControl('customRegexValidation', this.createFormCustomRegexValidation());
          if (this.type === 'trigger') {
            item.addControl('arrItemUniqueAcrossTriggers', new UntypedFormControl(false));
          }
          break;
        case 'file':
          item.get('dataType').setValue('string');
          item.setControl('renderDirective', this.createFormRenderDirective(RenderDirectiveType.File, null));
          break;
      }
    }
  }

  onChangItemDataType(event: MatSelectChange, item: UntypedFormGroup) {
    item.removeControl('customRegexValidation');
    if (event.value === 'object') {
      item.setControl(
        'arrItemTemplate',
        this.fb.group({
          template: [
            `{ "default": {{default}} }`,
            [
              Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.TEMPLATE }),
              this.checkValidTemplate.bind(this)
            ]
          ],
          parameters: this.fb.array([])
        })
      );
      this.generateControls(item);
      item.get('arrayItemDataType').setValue(event.value);
    } else {
      item.removeControl('arrItemTemplate');
      item.removeControl('renderDirective');
      if (event.value !== 'string' && event.value !== 'number') {
        const authorDataSource = this.dataSourceQuery.getEntity(event.value);
        if (authorDataSource) {
          item.get('arrayItemDataType').setValue(authorDataSource.valueDataType);
          item.setControl(
            'renderDirective',
            this.createFormRenderDirective(RenderDirectiveType.SingleSelect, authorDataSource.uuid)
          );
        } else {
          item.get('arrayItemDataType').setValue(event.value);
        }
      } else {
        item.get('arrayItemDataType').setValue(event.value);
        item.setControl('customRegexValidation', this.createFormCustomRegexValidation());
      }
    }
  }

  onChangeRequireInput(item: UntypedFormGroup, value: MatCheckboxChange) {
    item.get('isOptional').setValue(!value.checked);
  }

  private checkValidTemplate(control: AbstractControl) {
    const request = this.getParamsFromTemplate(control.value);

    if (control.value && control.value.length && !request.length) {
      return { template: true };
    }
    return null;
  }

  generateControls(form: UntypedFormGroup) {
    const request = this.getParamsFromTemplate(form.get('arrItemTemplate.template').value);

    if (request && request.length) {
      form.get('arrItemTemplate.template').setValue(Utils.trimText(form.get('arrItemTemplate.template').value) ?? '');

      const requestForms: UntypedFormGroup[] = [];
      request.forEach(p => {
        requestForms.push(
          this.fb.group({
            key: p,
            title: [
              '',
              Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
            ],
            description: [
              '',
              Utils.validateInput({
                required: false,
                dataType: 'string',
                maxlength: ValidateStringMaxLength.DESCRIPTION
              })
            ],
            dataType: 'string',
            dataTypeFake: 'string',
            defaultValueTree: null,
            hidden: false,
            requireUserInput: true,
            isOptional: false,
            require: true,
            renderDirective: null,
            visibilityDep: this.createFormVisibilityDep(),
            customRegexValidation: this.createFormCustomRegexValidation()
          })
        );
      });
      (form.get('arrItemTemplate') as UntypedFormGroup).setControl('parameters', this.fb.array(requestForms));
    } else {
      (form.get('arrItemTemplate') as UntypedFormGroup).setControl('parameters', this.fb.array([]));
    }
  }

  selectValueOfConfig(item: UntypedFormGroup, event) {
    delete event?.data?.label;
    item.get('defaultValueTree').setValue(event?.data);
  }

  changeRequireUserInput(item: UntypedFormGroup, value: MatCheckboxChange) {
    item.get('defaultValueTree').setValidators(null);
    item.get('hidden').setValue(!value.checked);
    if (value.checked == false) {
      item.get('title').setValue(item.get('key').value);
      item.get('require').setValue(true);
      item.get('require').enable();
      item.get('isOptional').setValue(false);

      const dataType = item.get('dataTypeFake').value;
      if (dataType !== 'string' && dataType !== 'number' && dataType !== 'boolean') {
        item.get('dataTypeFake').setValue('string');
        item.get('dataType').setValue('string');
      } else {
        item.get('defaultValueTree').setValidators(
          Utils.validateExp({
            required: true,
            dataType: dataType,
            maxlength: ValidateStringMaxLength.USER_INPUT,
            max: ValidateNumberValue.MAX,
            min: ValidateNumberValue.MIN
          })
        );
      }
    } else {
      item.get('title').setValue('');
    }
    item.get('defaultValueTree').updateValueAndValidity();
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

  private getParamsFromTemplate(template: string): string[] {
    const result: string[] = [];
    const regex = new RegExp('{{(.*?)}}', 'gm');
    const childTemplate = template?.match(regex);
    if (childTemplate) {
      childTemplate.forEach(str => {
        result.push(str.replace(/{{/g, '').replace(/}}/g, ''));
      });
    }
    return [...new Set(result)];
  }

  private createFormRenderDirective(type: RenderDirectiveType, valueListUuid: string): UntypedFormGroup {
    return this.fb.group({
      type: type,
      supportedMimeTypes: [[]],
      valueListUuid: valueListUuid
    });
  }

  private createFormVisibilityDep(): UntypedFormGroup {
    return this.fb.group({
      conditions: this.fb.array([]),
      requiredWhenShow: false
    });
  }

  private createFormCustomRegexValidation(): UntypedFormGroup {
    const form: UntypedFormGroup = this.fb.group({
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

    form.get('description').disable();
    form.get('pattern').valueChanges.subscribe(pattern => {
      if (!pattern) {
        form.get('description').disable();
      } else {
        form.get('description').enable();
      }
    });

    return form;
  }
}
