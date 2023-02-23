import { Component, Input, OnInit } from '@angular/core';
import { SupportedConvo } from '../../core/adapter/convo-helper.service';

@Component({
  selector: 'csh-convo-name',
  templateUrl: './convo-name.component.html',
  styleUrls: ['./convo-name.component.scss']
})
export class ConvoNameComponent implements OnInit {
  @Input() channel: SupportedConvo;
  @Input() title?: boolean;

  constructor() {}

  ngOnInit() {}
}
