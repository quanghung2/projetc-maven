import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material/expansion';
import { Utils } from '../utils';

@Component({
  selector: 'b3n-regex-pattern',
  templateUrl: './regex-pattern.component.html',
  styleUrls: ['./regex-pattern.component.scss']
})
export class RegexPatternComponent implements AfterViewInit {
  @Input() item: UntypedFormGroup;
  @ViewChild('configRegexPattern') configRegexPattern: MatExpansionPanel;

  get customRegexValidation(): UntypedFormGroup {
    return this.item.get('customRegexValidation') as UntypedFormGroup;
  }

  getErrorInput(ctrl: UntypedFormControl | AbstractControl) {
    return Utils.getErrorInput(ctrl);
  }

  constructor() {}

  ngAfterViewInit(): void {
    if (this.item.value.customRegexValidation.pattern !== '') {
      this.configRegexPattern.open();
    }
  }
}
