import { Component, Input } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { SharedConfigComponent } from '../../shared/config.component';

@Component({
  selector: 'b3n-action-config',
  templateUrl: './action-config.component.html',
  styleUrls: ['./action-config.component.scss']
})
export class ActionConfigComponent extends SharedConfigComponent {
  @Input() exceptValueOfDts: string;

  constructor(fb: UntypedFormBuilder) {
    super(fb);
  }
}
