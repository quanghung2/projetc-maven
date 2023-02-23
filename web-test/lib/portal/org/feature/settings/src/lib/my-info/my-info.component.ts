import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Address,
  AuthenticationService,
  CountryQuery,
  IdentityProfileQuery,
  MyInfo,
  Person,
  ProfileOrg,
  VerifyType
} from '@b3networks/api/auth';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'pos-my-info',
  templateUrl: './my-info.component.html',
  styleUrls: ['./my-info.component.scss']
})
export class MyInfoComponent extends DestroySubscriberComponent implements OnInit {
  readonly VerifyType = VerifyType;
  loading = false;
  requesting: boolean;
  corpPassVerifying: boolean;
  singPassVerifying: boolean;
  myInfo: MyInfo;
  address: Address;
  person: Person;
  profileOrg$: Observable<ProfileOrg>;
  createdDate: number;
  organization: ProfileOrg;
  verifyingStep: string;
  hasNoDigitalId: boolean;

  constructor(
    private router: ActivatedRoute,
    private authenticationService: AuthenticationService,
    private countryQuery: CountryQuery,
    private identityProfileQuery: IdentityProfileQuery,
    private toastr: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.router.queryParams.subscribe(params => {
      this.verifyingStep = params['verifyingStep'];
    });

    this.profileOrg$ = this.identityProfileQuery
      .selectProfileOrg(X.orgUuid)
      .pipe(tap(res => (this.organization = res)));

    this.loading = true;
    this.authenticationService
      .getMyInfo()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        myInfo => {
          this.myInfo = myInfo;
          this.showMyInfo();
        },
        error => {
          if (error?.code === 'auth.MyInfoVerificationUnavailable') {
            this.hasNoDigitalId = true;
          }
        }
      );
  }

  verify(type: VerifyType) {
    type === VerifyType.CorpPass ? (this.corpPassVerifying = true) : (this.singPassVerifying = true);
    const originalUrl = `${location.origin}/#/org-managements/?menu=myinfo`;
    this.authenticationService
      .createRedirectLink(originalUrl, type)
      .pipe(
        finalize(() => {
          this.corpPassVerifying = false;
          this.singPassVerifying = false;
        })
      )
      .subscribe(
        (url: string) => {
          if (url) {
            window.open(`${url}`, '_blank');
          }
        },
        err => {
          let message = err.message || err.code;
          if (err.code === 'auth.MyInfoVerificationUnavailable') {
            message =
              'Your domain administration needs to verify their account with MyInfo. Please contact them for assistance.';
          }
          this.toastr.warning(message);
        }
      );
  }

  private showMyInfo() {
    if (this.myInfo) {
      this.address = new Address(this.myInfo.entity.address ?? {});
      this.person = new Person(this.myInfo.person ?? {});
      const country = this.countryQuery.getAll().find(c => c.code === this.address.country);
      if (country) {
        this.address.contryDisplay = country.name;
      }
    }
  }
}
