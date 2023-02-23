import { Component } from '@angular/core';
import { buildUrlParameter } from '@b3networks/shared/common';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  queryParams = buildUrlParameter();
  unifiedPortal = `${location.origin}`;

  constructor() {}

  ngOnInit() {
    const params = Object.keys(this.queryParams)
      .filter(
        key => !!this.queryParams[key] && this.queryParams[key] !== 'null' && this.queryParams[key] !== 'undefined'
      )
      .map(key => `${key}=${this.queryParams[key]}`)
      .join('&');

    let uri = `${this.unifiedPortal}`;
    if (!!params) {
      uri += `/?${params}`;
    }

    this.go2UnifiedPortal(uri);
  }

  go2UnifiedPortal(uri?: string) {
    uri = uri || this.unifiedPortal;
    window.location.replace(uri);
  }
}
