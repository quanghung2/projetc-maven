import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RoutingPlan } from '@b3networks/api/cp';

@Component({
  selector: 'b3n-routing-plan-dialog',
  templateUrl: './routing-plan-dialog.component.html',
  styleUrls: ['./routing-plan-dialog.component.scss']
})
export class RoutingPlanDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: RoutingPlan[]) {}

  ngOnInit(): void {}
}
