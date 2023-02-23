import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'bar-rating',
  templateUrl: './bar-rating.component.html',
  styleUrls: ['./bar-rating.component.scss']
})
export class BarRatingComponent implements OnInit {
  @Input() max = 5;
  @Input() defaultRate = 5;
  @Input() starSize = '4rem';
  @Output() value = new EventEmitter<number>();

  currentValue: number;

  constructor() {}

  ngOnInit() {
    this.currentValue = this.defaultRate;
  }

  changeValue(i: number) {
    this.currentValue = i;
    this.value.emit(i);
  }
}
