import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'pom-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss']
})
export class ActionBarComponent {
  @Input() loading: boolean;
  @Output() register = new EventEmitter();
  constructor() {}
}
