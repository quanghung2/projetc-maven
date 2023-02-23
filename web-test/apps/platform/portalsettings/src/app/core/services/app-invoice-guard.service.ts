import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PartnerService } from './partner.service';

@Injectable({ providedIn: 'root' })
export class AppInvoiceGuardService implements CanActivate {
  constructor(private router: Router, private partnerService: PartnerService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.partnerService.canAccessInvoiceApp().pipe(
      tap(isAllowed => {
        if (!isAllowed) {
          this.router.navigate(['/invoice-permission']);
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
