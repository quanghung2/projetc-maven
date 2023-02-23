import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-login-preview',
  templateUrl: './login-preview.component.html',
  styleUrls: ['./login-preview.component.scss']
})
export class LoginPreviewComponent implements OnInit {
  @Input()
  faviconUrl: string;
  @Input()
  title: string;
  @Input()
  headerBackgroundColor: string;
  @Input()
  logoUrl: string;
  @Input()
  buttonBackgroundColor: string;

  domain: string;

  constructor() {
    this.domain = window.location.host;
  }

  ngOnInit() {}
}
