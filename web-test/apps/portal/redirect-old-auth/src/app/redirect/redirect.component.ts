import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'b3n-redirect',
  templateUrl: './redirect.component.html',
  styleUrls: ['./redirect.component.scss']
})
export class RedirectComponent implements OnInit {
  redirectTime = 5;
  loginUrl = `${location.origin}/#/auth`;

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe(data => {
      const segment = data['segment'];
      console.log(this.activatedRoute.snapshot.queryParams);

      const params = [];
      if (this.activatedRoute.snapshot.queryParams) {
        Object.keys(this.activatedRoute.snapshot.queryParams).forEach(key => {
          params.push(`${key}=${encodeURIComponent(this.activatedRoute.snapshot.queryParams[key])}`);
        });
      }

      let uri = `${this.loginUrl}/`;
      uri += !!segment ? segment : '';
      if (params.length) {
        uri += '?' + params.join('&');
      }

      this.go2loginPage(uri);
    });
  }

  go2loginPage(uri?: string) {
    console.log(uri);
    uri = uri || this.loginUrl;
    window.location.replace(uri);
  }
}
