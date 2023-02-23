import { Component, Input } from '@angular/core';

@Component({
  selector: 'b3n-color-menu',
  templateUrl: './color-menu.component.html',
  styleUrls: ['./color-menu.component.scss']
})
export class ColorMenuComponent {
  @Input() colorMark: string;
  colorList: string[] = [
    '#5151E1',
    '#E15151',
    '#E19951',
    '#E1E151',
    '#99E151',
    '#51E151',
    '#51E199',
    '#51E1E1',
    '#5199E1',
    '#9951E1',
    '#E151E1',
    '#E15199'
  ];
}
