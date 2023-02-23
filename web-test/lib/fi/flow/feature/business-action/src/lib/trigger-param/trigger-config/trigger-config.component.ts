import { Component } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { SharedConfigComponent } from '../../shared/config.component';

@Component({
  selector: 'b3n-trigger-config',
  templateUrl: './trigger-config.component.html',
  styleUrls: ['./trigger-config.component.scss']
})
export class TriggerConfigComponent extends SharedConfigComponent {
  constructor(fb: UntypedFormBuilder) {
    super(fb);
  }
}
