import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'b3n-call-journey',
  templateUrl: './call-journey.component.html',
  styleUrls: ['./call-journey.component.scss']
})
export class CallJourneyComponent implements OnInit {
  callJourney: string[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data) {
    this.callJourney = data.details.callJourney;
  }

  ngOnInit() {}
}
