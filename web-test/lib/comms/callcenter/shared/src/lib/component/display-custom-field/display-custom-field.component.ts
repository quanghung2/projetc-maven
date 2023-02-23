import { Component, Input, OnInit } from '@angular/core';
import { DetailCustomField, TypeCustomField } from '@b3networks/api/callcenter';

@Component({
  selector: 'b3n-display-custom-field',
  templateUrl: './display-custom-field.component.html',
  styleUrls: ['./display-custom-field.component.scss']
})
export class DisplayCustomFieldComponent implements OnInit {
  @Input() detailField: DetailCustomField;

  readonly TypeCustomField = TypeCustomField;

  constructor() {}

  ngOnInit(): void {
    this.detailField.value = this.detailField.value
      ? this.detailField.value
      : this.detailField.type === TypeCustomField.textField || this.detailField.type === TypeCustomField.numberField
      ? ''
      : [];
  }
}
