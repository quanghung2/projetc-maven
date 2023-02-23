import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { forkJoin, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { PartnerService } from './partner.service';
import { RouteService } from './route.service';

@Injectable({ providedIn: 'root' })
export class AppGuardService implements CanActivate {
  constructor(private router: Router, private routeService: RouteService, private partnerService: PartnerService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return forkJoin(this.partnerService.canAccessApp(), this.routeService.domain).pipe(
      map(([canAccess, domain]) => canAccess && !!domain),
      tap(isAllowed => {
        if (!isAllowed) {
          this.router.navigate(['/permission']);
        }
      }),
      catchError(err => {
        console.log(err);
        this.router.navigate(['/error']);
        return throwError(err);
      })
    );
  }
}
