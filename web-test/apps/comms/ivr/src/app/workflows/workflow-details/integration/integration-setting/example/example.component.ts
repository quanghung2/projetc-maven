import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IntegrationType } from '@b3networks/api/ivr';

@Component({
  selector: 'b3n-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent implements OnInit {
  IntegrationType = IntegrationType;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    console.log(data);
  }

  ngOnInit() {}
}
