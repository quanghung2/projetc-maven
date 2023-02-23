import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Transfer2GenieConfig } from '@b3networks/api/callcenter';
import { SkillCatalog } from '@b3networks/api/intelligence';
import { DestroySubscriberComponent } from '@b3networks/shared/common';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}

@Component({
  selector: 'b3n-authentication-detail',
  templateUrl: './authentication-detail.component.html',
  styleUrls: ['./authentication-detail.component.scss']
})
export class AuthenticationDetailComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('authenCode') input: ElementRef; // handle focus input
  @Input() genieConfig: Transfer2GenieConfig;
  @Input() parentForm: UntypedFormArray;
  @Input() skills: SkillCatalog[];
  @Input() index: number;
  @Output() onDeteled = new EventEmitter<number>();

  authenSettings: AuthenSettingModel = new AuthenSettingModel();
  matcher = new MyErrorStateMatcher();
  isExpand = true;
  isNotExist = false;
  indexSelected: number;
  _form: UntypedFormGroup = this.fb.group({
    codeAuthen: ['', [Validators.required, this.checkDuplicateCode]],
    skillId: ['', [Validators.required]],
    fields: this.fb.array([]),
    path: '',
    name: ''
  });
  skillSelected: UntypedFormControl = this.fb.control(undefined);

  get codeAuthen() {
    return this._form.get('codeAuthen') as UntypedFormControl;
  }

  get skillId() {
    return this._form.get('skillId');
  }

  get fields(): UntypedFormArray {
    return this._form.get('fields') as UntypedFormArray;
  }

  constructor(private fb: UntypedFormBuilder, private eleRef: ElementRef) {
    super();
  }

  ngOnInit() {
    this.indexSelected = this.getIndexSkillSelected();
    this.authenSettings = this.transferModelSetting(this.genieConfig, this.skills);
    if (this.indexSelected > -1) {
      this.skillSelected.setValue(this.authenSettings.listSkill[this.indexSelected].skillId);
    }
    this.setValueForm(this.authenSettings, this.indexSelected);

    // add control
    setTimeout(() => {
      this.parentForm.push(this._form);
    }, 0);
  }

  transferModelSetting(genieConfig: Transfer2GenieConfig, skills: SkillCatalog[]) {
    const model = new AuthenSettingModel({
      codeAuthen: this.genieConfig.codeAuthen,
      listSkill: skills.map(
        skill =>
          new skillInfo({
            skillId: skill.code,
            path: skill.path,
            name: skill.name,
            fields: skill.params.map(
              param =>
                new paramsInfo({
                  fieldName: param.key,
                  lable: param.name,
                  fieldValue: genieConfig.fields.find(x => x.fieldName === param.key)?.fieldValue || '',
                  isRequired: param.isRequired
                })
            )
          })
      )
    });
    return model;
  }

  setValueForm(setting: AuthenSettingModel, index: number) {
    // reset value form
    this._form.reset();
    this.fields.clear();

    if (index > -1) {
      this._form.patchValue({
        codeAuthen: setting.codeAuthen,
        skillId: setting.listSkill[index].skillId,
        path: setting.listSkill[index].path,
        name: setting.listSkill[index].name
      });

      setting.listSkill[index].fields.forEach(field => {
        this.fields.push(this.createFormGroupParams(field));
      });
    } else {
      this._form.patchValue({
        codeAuthen: setting.codeAuthen
      });
    }
  }

  getIndexSkillSelected() {
    // is addMore
    if (this.genieConfig.skillId) {
      // check exist
      const index = this.skills.findIndex(skill => skill.code === this.genieConfig.skillId);

      if (index > -1) {
        return index;
      }
      // doesn't exited
      this.isNotExist = true;
      return -1;
    }
    this.isExpand = true;
    this.isNotExist = false;
    this.focusInput();
    return 0;
  }

  focusInput() {
    setTimeout(() => {
      this.input.nativeElement.focus();
    }, 500);
  }

  focusParams() {
    if (this.isExpand) {
      setTimeout(() => {
        this.eleRef.nativeElement.querySelector('.params-input input').focus();
      }, 400);
    }
  }

  createFormGroupParams(item: paramsInfo): UntypedFormGroup {
    const group = this.fb.group({
      fieldName: item.fieldName,
      lable: item.lable,
      fieldValue: '',
      isRequired: item.isRequired
    });
    if (item.isRequired) {
      group.get('fieldValue').setValidators([Validators.required]);
    }
    // trigger check validator required
    group.get('fieldValue').setValue(item.fieldValue);
    return group;
  }

  onChangeSkill(skillId) {
    // save value for this params-skill with exeited skill
    if (this.indexSelected > -1) {
      const valueSkill = this._form.value;
      this.authenSettings.codeAuthen = valueSkill.codeAuthen;
      Object.assign(this.authenSettings.listSkill[this.indexSelected], new skillInfo(valueSkill));
    }

    // get new index with skild ID
    this.indexSelected = this.authenSettings.listSkill.findIndex(x => x.skillId === skillId);
    this.setValueForm(this.authenSettings, this.indexSelected);
    this.isExpand = true;
    this.isNotExist = false;
    this.focusParams();
  }

  onDelete() {
    this.onDeteled.next(this.index);
  }

  checkDuplicateCode(control: AbstractControl): { [key: string]: boolean } {
    const value = control.value;
    if (!value || value.trim === '') {
      return null;
    }
    const parents = control?.root;
    if (parents && parents.value && parents.value.length > 0) {
      const checkduplicate = parents.value.some(x => x.codeAuthen === value);
      return checkduplicate ? { duplicate: true } : null;
    }
    return null;
  }
}

// model handle UI
export class AuthenSettingModel {
  codeAuthen: string;
  listSkill: skillInfo[] = [];
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.listSkill = this.listSkill.map(x => new skillInfo(x));
    }
  }
}

export class skillInfo {
  skillId: string;
  fields: paramsInfo[] = [];
  path: string;
  name: string;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.fields = this.fields.map(x => new paramsInfo(x));
    }
  }
}

export class paramsInfo {
  fieldName: string;
  lable: string;
  fieldValue: string;
  isRequired: boolean;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
