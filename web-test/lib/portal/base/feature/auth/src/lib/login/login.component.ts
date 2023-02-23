import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginRequest, LoginResponse, MsLoginService, RealDomainService, VerifyStatusReq } from '@b3networks/api/auth';
import { PortalConfig, PortalConfigQuery } from '@b3networks/api/partner';
import { SessionService } from '@b3networks/portal/base/shared';
import { DestroySubscriberComponent, DomainUtilsService, encrypt, isExternalUrl } from '@b3networks/shared/common';
import { Observable, takeUntil } from 'rxjs';

@Component({
  selector: 'pba-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('idInput') idInput: ElementRef;
  @ViewChild('passwordInput') passwordInput: ElementRef;

  config$: Observable<PortalConfig>;
  returnUrl = '';
  loginResponse: LoginResponse;
  loginForm: UntypedFormGroup;
  domainParam: string;

  showPassword = false;
  indicator = false;
  error: string;
  showErrorSummary = false;

  enable2Fa = false;
  enableVerifyEmail = false;
  checking: boolean;
  enableLoginWithMs: boolean;

  get domain(): UntypedFormControl {
    return this.loginForm.get('domain') as UntypedFormControl;
  }

  get credential(): UntypedFormControl {
    return this.loginForm.get('credential') as UntypedFormControl;
  }

  get password(): UntypedFormControl {
    return this.loginForm.get('password') as UntypedFormControl;
  }

  getErrorCredential() {
    return this.credential.hasError('required') ? 'Please enter your email or number' : '';
  }

  getErrorPassword() {
    return this.password.hasError('required') ? 'Please enter your password' : '';
  }

  constructor(
    private fb: UntypedFormBuilder,
    private activatedRoute: ActivatedRoute,
    private sessionService: SessionService,
    private portalConfigQuery: PortalConfigQuery,
    private domainUtilsService: DomainUtilsService,
    private realDomainService: RealDomainService,
    private router: Router,
    private msService: MsLoginService
  ) {
    super();
    this.realDomainService
      .getRealDomainFromPortalDomain()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(resp => {
        this.enableLoginWithMs = resp.ssoIdPs && resp.ssoIdPs.includes('microsoft');
      });
  }

  back() {
    this.router.navigate(['']);
  }

  ngOnInit() {
    this.config$ = this.portalConfigQuery.portalConfig$;
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['redirectUrl'] || params['redirectUri']) {
        this.returnUrl = decodeURIComponent(params['redirectUrl'] || params['redirectUri']);
      }

      this.domainParam = params['domain'];
      const state = params['state'];
      const code = params['code'];
      if (state && code) {
        this.checkMsLoginStatus(state, code);
      }
    });

    this.loginForm = this.fb.group({
      domain: [this.domainParam ?? this.domainUtilsService.getPortalDomain()],
      credential: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });

    this.sessionService.checkSessionExpiry().subscribe(hasValidSession => {
      if (hasValidSession) {
        this._loggedInResult();
      }
    });
  }

  checkMsLoginStatus(state, code) {
    this.checking = true;

    const req = {
      state: state,
      code: code
    } as VerifyStatusReq;

    this.msService.verifyStatus(req).subscribe({
      next: () => {
        const url = window.location.origin;
        window.location.replace(url);
      },
      error: () => {
        this.checking = false;
      }
    });
  }

  showRememberMe() {
    return location.hostname !== 'gelcccs.zonetel.com.sg';
  }

  login() {
    if (this.loginForm.valid && !this.indicator) {
      this.indicator = true;
      this.realDomainService.getRealDomainFromPortalDomain().subscribe(async realDOmain => {
        const loginForm = <LoginRequest>this.loginForm.value;
        if (realDOmain.publicKey) {
          // encrypt password
          loginForm.password = await encrypt(loginForm.password, realDOmain.publicKey);
        }
        this.sessionService.login(loginForm).subscribe(
          response => {
            if (response.type) response.type = response.type.toLowerCase();
            this.loginResponse = response;
            this.indicator = false;
            this.showErrorSummary = false;
            if (response.needVerifyOPT) {
              this.enable2Fa = true;
            } else if (response.need2UpdateEmailFirst) {
              this.enableVerifyEmail = true;
            } else {
              this._loggedInResult();
            }
          },
          error => {
            this.indicator = false;
            this.showErrorSummary = true;
            this.clearInput();
            if (error.code) {
              if (error.code === 'auth.violatedSecurityPolicy.ip_address_blocked') {
                this.error = 'Access Denied: Unauthorized IP Address';
              } else {
                this.error = 'You have entered an invalid Sign-in ID or password';
              }
            } else {
              this.error = 'You have entered an invalid Sign-in ID or password';
            }
          }
        );
      });
    }
  }

  onCompletedExtraStep() {
    this._loggedInResult();
  }

  removeReadonlyAttr(input: HTMLInputElement) {
    input.removeAttribute('readonly');
  }

  clearInput() {
    this.idInput.nativeElement.value = '';
    this.passwordInput.nativeElement.value = '';
  }

  private _loggedInResult() {
    console.log(`Logged in, redirect to return url...`);

    if (this.returnUrl) {
      if (isExternalUrl(this.returnUrl)) {
        window.location.replace(this.returnUrl);
      } else {
        this.router.navigateByUrl(this.returnUrl);
      }
    } else {
      this.router.navigate(['/']);
    }
  }
}
