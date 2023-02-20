import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isLogin: boolean;
  constructor() { }

  ngOnInit(): void {
  }

  loginSuccess(isLogin: boolean) {
    this.isLogin = isLogin
    console.log("🚀 ~ this.isLogin", this.isLogin)
  }
}
