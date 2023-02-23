import { Component, OnInit } from '@angular/core';

declare var X: any;

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  ngOnInit() {
    X.init();
  }
}
