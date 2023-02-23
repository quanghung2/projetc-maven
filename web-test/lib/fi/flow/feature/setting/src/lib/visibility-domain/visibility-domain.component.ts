import { Component, Input } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';

@Component({
  selector: 'b3n-visibility-domain',
  templateUrl: './visibility-domain.component.html',
  styleUrls: ['./visibility-domain.component.scss']
})
export class VisibilityDomainComponent {
  @Input() domainVisibility: UntypedFormGroup;
  @Input() isShowVisibilityInherit = true;

  orgUuidCtrl = new UntypedFormControl(
    '',
    Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
  );

  get visibility(): UntypedFormControl {
    return this.domainVisibility?.get('visibility') as UntypedFormControl;
  }

  get accessibleUsers(): UntypedFormArray {
    return this.domainVisibility?.get('accessibleUsers') as UntypedFormArray;
  }

  get visibilityInherit(): UntypedFormControl {
    return this.domainVisibility?.get('visibilityInherit') as UntypedFormControl;
  }

  getErrorOrgUuidCtrl() {
    const textErr = Utils.getErrorInput(this.orgUuidCtrl);
    return textErr ? textErr : this.orgUuidCtrl.hasError('duplicate') ? 'Org UUID already exists' : '';
  }

  constructor() {}

  onChangeVisibility(event: MatCheckboxChange) {
    if (event.checked) {
      this.visibility.disable();
    } else {
      this.visibility.enable();
    }
  }

  addOrg() {
    const newValue = Utils.trimText(this.orgUuidCtrl.value);
    const value = this.accessibleUsers.value.find(i => i == newValue);
    if (!value) {
      this.accessibleUsers.push(new UntypedFormControl(newValue));
      this.orgUuidCtrl.setValue('');
      this.orgUuidCtrl.setErrors(null);
    } else {
      this.orgUuidCtrl.setErrors({ duplicate: true });
    }
  }

  removeOrg(index: number) {
    this.accessibleUsers.removeAt(index);
  }
}
