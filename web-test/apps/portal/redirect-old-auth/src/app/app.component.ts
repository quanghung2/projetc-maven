import { Component } from '@angular/core';
import { UrlParamsService } from './url-params.service';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private urlParamService: UrlParamsService) {
    this.urlParamService.init();
  }
}
