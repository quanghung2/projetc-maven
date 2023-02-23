import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService, VerifyEmail } from '@b3networks/api/auth';
import { DomainUtilsService } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'pba-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: ToastService,
    private domainUtilsService: DomainUtilsService,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['token'] && params['context']) {
        const data = new VerifyEmail({
          domain: this.domainUtilsService.getPortalDomain(),
          context: params['context'],
          token: params['token']
        });

        this.authenticationService.verifyEmail(data).subscribe(
          () => {
            this.toastr.success('You have successfully verified your email address');
            this.router.navigate(['auth', 'login']);
          },
          error => {
            if (error.code && error.code.indexOf('TokenExpired') > -1) {
              this.toastr.error('Your token has been expired');
            } else {
              this.toastr.error('Email Verification Error');
            }
            this.router.navigate(['auth', 'login']);
          }
        );
      }
    });
  }
}
