import { Component, Input, OnChanges } from '@angular/core';
import { BodyParameter, Output } from '@b3networks/api/flow';

@Component({
  selector: 'b3n-output-action',
  templateUrl: './output-action.component.html',
  styleUrls: ['./output-action.component.scss']
})
export class OutputActionComponent implements OnChanges {
  @Input() outputs: Array<Output | BodyParameter>;
  @Input() setOpacity: boolean;
  @Input() showCustom: boolean;
  data: Array<Output | BodyParameter>;

  constructor() {}

  ngOnChanges(): void {
    this.data = this.outputs;
  }
}
