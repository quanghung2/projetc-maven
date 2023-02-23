import { Component, Input } from '@angular/core';
import { ActionDef } from '@b3networks/api/flow';

@Component({
  selector: 'b3n-action-def-info',
  templateUrl: './action-def-info.component.html',
  styleUrls: ['./action-def-info.component.scss']
})
export class ActionDefInfoComponent {
  @Input() actionDefWhenHover: ActionDef;

  keyActionDefs = ['urlParameters', 'headersParameters', 'bodyParameters', 'parameters'];

  constructor() {}
}
