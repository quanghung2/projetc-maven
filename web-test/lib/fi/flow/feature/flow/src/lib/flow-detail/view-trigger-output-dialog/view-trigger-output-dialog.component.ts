import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Trigger, TriggerQuery } from '@b3networks/api/flow';

export interface ViewTriggerOutputDialogInput {
  type: 'NORMAL' | 'SUBROUTINE';
  data;
}

@Component({
  selector: 'b3n-view-trigger-output-dialog',
  templateUrl: './view-trigger-output-dialog.component.html',
  styleUrls: ['./view-trigger-output-dialog.component.scss']
})
export class ViewTriggerOutputDialogComponent implements OnInit {
  trigger: Trigger;

  constructor(
    @Inject(MAT_DIALOG_DATA) public input: ViewTriggerOutputDialogInput,
    private triggerQuery: TriggerQuery
  ) {}

  ngOnInit(): void {
    this.trigger = this.triggerQuery.getValue();
  }
}
