import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PurchaseNumberComponent } from './purchase-number/purchase-number.component';

@Component({
  selector: 'b3n-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit {
  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  purchase() {
    this.dialog.open(PurchaseNumberComponent, {
      width: '100vw',
      maxWidth: 'auto',
      height: '100vh'
    });
  }
}
