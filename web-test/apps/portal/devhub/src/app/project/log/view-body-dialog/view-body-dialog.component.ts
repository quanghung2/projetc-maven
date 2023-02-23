import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'b3n-view-body-dialog',
  templateUrl: './view-body-dialog.component.html',
  styleUrls: ['./view-body-dialog.component.scss']
})
export class ViewBodyDialogComponent implements OnInit {
  keys = [];
  object = {};

  constructor(@Inject(MAT_DIALOG_DATA) private body: string) {}

  ngOnInit() {
    this.object = JSON.parse(this.body);
    this.keys = Object.keys(this.object) ?? [];
  }

  isObject(value): boolean {
    return value !== null && typeof value === 'object';
  }

  getObjectkeys(value: object): string[] {
    return Object.keys(value);
  }
}
