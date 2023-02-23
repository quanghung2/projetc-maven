import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationService, SessionQuery, SessionService } from '@b3networks/portal/base/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'pba-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {
  constructor(
    private router: Router,
    private sessionQuery: SessionQuery,
    private sessionService: SessionService,
    private applicationService: ApplicationService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    this.sessionService
      .logout()
      .pipe(
        finalize(() => {}),
        catchError(_ => of())
      )
      .subscribe(_ => {
        this.applicationService.cleanup();
        this.logout();
        this.toastr.success('You have signed out of your account.');
      });
  }

  logout() {
    this.router.navigate(['auth', 'login']);
  }
}
