import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { FieldsConfig, Transfer2GenieConfig } from '@b3networks/api/callcenter';
import { ParamConfig, SkillCatalog } from '@b3networks/api/intelligence';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { takeUntil } from 'rxjs/operators';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}

@Component({
  selector: 'b3n-genie-config',
  templateUrl: './genie-config.component.html',
  styleUrls: ['./genie-config.component.scss']
})
export class GenieConfigComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  @Input() skills: SkillCatalog[];
  @Input() genieConfig: Transfer2GenieConfig;
  @Input() formParents: UntypedFormGroup;

  indexCurrent: number;
  matcher = new MyErrorStateMatcher();
  arrSkills: SkillCatalog[] = [];
  isExist = false;
  _form: UntypedFormGroup = this.fb.group({
    skillId: ['', [Validators.required]],
    params: this.fb.array([])
  });

  get skillId() {
    return this._form.get('skillId');
  }
  get params(): UntypedFormArray {
    return this._form.get('params') as UntypedFormArray;
  }

  constructor(private fb: UntypedFormBuilder, private eleRef: ElementRef, private cdr: ChangeDetectorRef) {
    super();
  }

  override ngOnDestroy() {
    this.formParents.removeControl('data');
  }

  ngOnInit() {
    this.formParents.addControl('data', this._form);

    // new instance skills
    this.skills.forEach(item => {
      this.arrSkills.push(new SkillCatalog(item));
    });
    this.indexCurrent = this.getIndexSelected();

    // isExist
    if (!this.isExist) {
      this.onInitForm();
      this.mapValueParams(this.genieConfig.fields);
      this.addValueParamsControl();
    }

    this.cdr.detectChanges();

    // save value
    this._form.valueChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe(value => {
      // if(this)
      if (this.indexCurrent && value && value.params.length === this.arrSkills[this.indexCurrent].params.length) {
        this.arrSkills[this.indexCurrent].params.forEach(item => {
          const index = value.params.findIndex(x => x.key === item.key);
          item.value = value.params[index].value;
        });
      }
    });
  }

  onInitForm() {
    this._form.patchValue({
      skillId: this.skills[this.indexCurrent].code
    });
  }

  getIndexSelected() {
    if (this.genieConfig.skillId) {
      // check exist
      const index = this.arrSkills.findIndex(skill => skill.code === this.genieConfig.skillId);
      if (index >= 0) {
        return index;
      }
      this.isExist = true;
      return null;
    }
    // get First if null
    this.focusInput();
    return 0;
  }

  mapValueParams(fields: FieldsConfig[]) {
    this.arrSkills[this.indexCurrent].params.forEach(param => {
      fields.forEach(field => {
        if (field.fieldName === param.key) {
          param.value = field.fieldValue;
          return;
        }
      });
    });
  }

  addValueParamsControl() {
    this.arrSkills[this.indexCurrent].params.forEach(item => {
      this.params.push(this.createFormGroupParams(item));
    });
    this._form.updateValueAndValidity();
    Object.assign(this.genieConfig, this._form.value);
  }

  createFormGroupParams(item: ParamConfig): UntypedFormGroup {
    const group = this.fb.group({
      key: item.key,
      name: item.name,
      value: '',
      isRequired: item.isRequired
    });
    if (item.isRequired) {
      group.get('value').setValidators([Validators.required]);
      group.get('value').updateValueAndValidity({ emitEvent: false, onlySelf: true });
    }
    group.get('value').patchValue(item.value);
    return group;
  }

  focusInput() {
    setTimeout(() => {
      this.eleRef.nativeElement.querySelector('.params-input input').focus();
    }, 400);
  }

  onChangeSkill(code: string) {
    this.indexCurrent = this.arrSkills.findIndex(item => item.code === code);
    this.setValueParamsBySkill(this.indexCurrent);
    this.isExist = false;
    this.focusInput();
  }

  setValueParamsBySkill(indexCurrent: number) {
    if (this.params) {
      this.params.clear();
      this.arrSkills[indexCurrent].params.forEach(param => {
        this.params.push(this.createFormGroupParams(param));
      });
      this._form.updateValueAndValidity();
      this.cdr.detectChanges();
    }
  }
}
