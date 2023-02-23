import { Component, Input } from '@angular/core';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { VariableForAction } from '@b3networks/api/flow';

@Component({
  selector: 'b3n-parameter-datasource',
  templateUrl: './parameter.component.html',
  styleUrls: ['./parameter.component.scss']
})
export class ParameterDatasourceComponent {
  @Input() title: string;
  @Input() group: UntypedFormGroup;
  @Input() key: string;
  @Input() contextVariables: VariableForAction[];

  get parameters(): UntypedFormArray {
    return this.group.get(this.key) as UntypedFormArray;
  }

  selectValueOfConfig(item: UntypedFormGroup, event) {
    delete event?.data?.label;
    item.get('defaultValueTree').setValue(event?.data);
  }
}
