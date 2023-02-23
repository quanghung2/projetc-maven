import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicAccessGuard implements CanActivate {
  constructor(private router: Router, private route: ActivatedRoute) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    if (state.url === '/phone-setting') {
      this.router.navigate([state.url], {
        queryParams: {
          appVersion: '',
          enabledLicenseOnly: true,
          isMobileApp: true,
          darkMode: 'false'
        },
        relativeTo: this.route
      });

      return false;
    }

    return true;
  }
}
