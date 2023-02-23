import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { MatInput } from '@angular/material/input';
import { Block } from '@b3networks/api/ivr';

@Component({
  selector: 'b3n-common',
  templateUrl: './common.component.html',
  styleUrls: ['./common.component.scss']
})
export class CommonComponent implements OnInit, OnChanges {
  @Input() block: Block;

  @ViewChild('nameInput') nameInput: MatInput;

  showBlockContext: boolean;
  name: string;
  value: string;
  lengthOfVariables: number;
  backupData: any = {};

  constructor() {}

  ngOnInit() {
    this.showBlockContext = false;
    this.lengthOfVariables = Object.keys(this.block.variables).length;
  }

  ngOnChanges() {
    this.showBlockContext = false;
    this.lengthOfVariables = Object.keys(this.block.variables).length;
  }

  addParams() {
    if (!this.value) return;
    if (this.showBlockContext) {
      this.block.variables[this.name?.trim()] = this.value?.trim();
      this.lengthOfVariables = Object.keys(this.block.variables).length;
      this.name = '';
      this.value = '';

      this.nameInput.focus();
    }
  }

  onChangeAdvanceStatus(status: boolean) {
    this.showBlockContext = status;
    if (this.showBlockContext) {
      this.block.variables = this.backupData ? this.backupData : {};
    } else {
      this.backupData = this.block.variables;
      this.block.variables = {};
    }
  }

  removeVariable(variable) {
    delete this.block.variables[variable];
    this.lengthOfVariables = Object.keys(this.block.variables).length;
  }

  toggleBlockContext() {
    this.showBlockContext = !this.showBlockContext;
  }
}
