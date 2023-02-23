import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UrlParamsService } from '../url-params.service';

@Component({
  selector: 'b3n-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent {
  constructor(router: Router, urlParamService: UrlParamsService) {
    const urlParameter = urlParamService.urlParams;

    // redirect page based on url parameter
    if (urlParameter['campaignid']) {
      router.navigate(['signup'], { queryParams: urlParameter });
    } else if (urlParamService.getRedirectUrl() && urlParameter['showAccountSelect'] === 'true') {
      router.navigate(['authorizeV2'], { queryParams: urlParameter });
    } else if (urlParameter['appId'] && urlParamService.getRedirectUrl()) {
      router.navigate(['authorize'], { queryParams: urlParameter });
    } else if (urlParameter['context'] && urlParameter['token']) {
      router.navigate(['verifyemail'], { queryParams: urlParameter });
    } else {
      router.navigate(['signin'], { queryParams: urlParameter });
    }
  }
}
