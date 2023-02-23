import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { TEMPLATE_SLIDES } from '@b3networks/api/dashboard';

@Component({
  selector: 'b3n-select-template',
  templateUrl: './select-template.component.html',
  styleUrls: ['./select-template.component.scss']
})
export class SelectTemplateComponent implements OnInit {
  @Output() templateChange = new EventEmitter<{ slide: number; templateId: number }>();
  @Output() slideChange = new EventEmitter<number>();

  @Input() remainNameChar: number;
  @Input() selectTemplateForm: UntypedFormGroup;
  @Input() activeSlide: number;
  @Input() activeTemplate: number;

  readonly TEMPLATE_SLIDES = TEMPLATE_SLIDES;

  constructor() {}

  ngOnInit() {}
}
