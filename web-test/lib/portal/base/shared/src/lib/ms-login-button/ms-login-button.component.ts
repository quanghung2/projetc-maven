import { Component, Input, OnInit } from '@angular/core';
import { CreateRedirectLinkReq, MsLoginService } from '@b3networks/api/auth';
import { finalize } from 'rxjs/operators';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-ms-login-button',
  templateUrl: './ms-login-button.component.html',
  styleUrls: ['./ms-login-button.component.scss']
})
export class MsLoginButtonComponent implements OnInit {
  @Input() activationToken: string;

  progressing: boolean;

  constructor(private msService: MsLoginService, private toastService: ToastService) {}

  ngOnInit(): void {}

  loginWithMs() {
    this.progressing = true;

    const originalUrl = location.origin.includes('localhost')
      ? `https://portal.hoiio.net/#/auth/login`
      : `${location.origin}/#/auth/login`;
    const req = {
      srcUrl: originalUrl,
      deviceType: 'web'
    } as CreateRedirectLinkReq;

    if (this.activationToken) {
      req.activationToken = this.activationToken;
    }

    this.msService
      .createRedirectLink(req)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe({
        next: url => {
          window.location.replace(url);
        },
        error: err => {
          this.toastService.error(
            err.message || 'An error has occurred while creating a redirect link. Please try again in a few minutes.'
          );
        }
      });
  }
}
