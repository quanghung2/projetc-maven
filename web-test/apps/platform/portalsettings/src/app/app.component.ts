import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { PartnerService } from './core/services';
import { RouteService } from './core/services/route.service';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  isLoading = true;

  constructor(private routeService: RouteService, private partnerService: PartnerService) {}

  ngOnInit() {
    this.partnerService.canAccessApp().subscribe(canAccess => {
      if (!canAccess) {
        this.routeService.domain.next(null);
        this.routeService.domain.complete();

        this.routeService.supportedCurrencies.next([]);
        this.routeService.supportedCurrencies.complete();
        this.isLoading = false;
      } else {
        this.partnerService
          .getDomain()
          .pipe(
            finalize(() => {
              this.isLoading = false;
            })
          )
          .subscribe(
            domain => {
              this.routeService.domain.next(domain.domain);
              this.routeService.domain.complete();

              this.routeService.supportedCurrencies.next(domain.supportedCurrencies);
              this.routeService.supportedCurrencies.complete();
            },
            err => {
              this.routeService.domain.error(err);
              this.routeService.supportedCurrencies.error(err);
            }
          );
      }
    });
  }
}
