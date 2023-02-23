import { Location } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'b3n-settings-navigate',
  templateUrl: './settings-navigate.component.html',
  styleUrls: ['./settings-navigate.component.scss']
})
export class SettingsNavigateComponent implements OnInit {
  @Input() title: string;
  @Input() hasSave: boolean;
  @Input() isDisableBtn: boolean;
  @Input() loading: boolean;
  @Output() saveFn = new EventEmitter();

  constructor(private location: Location) {}

  ngOnInit(): void {}

  back() {
    this.location.back();
  }

  save() {
    this.saveFn.emit();
  }
}
