import { GoogleLoginProvider, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { AuthenticationGoogle, ExternalOAuthQuery, ExternalOAuthService } from '@b3networks/api/auth';
import { CustomersQuery } from '@b3networks/api/callcenter';
import { LocalStorageUtil, X } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { LocalStorageLiveChat } from '../tab.component';
import { environment } from './../../../environments/environment';

export interface InformationCustomer {
  name: string;
  email: string;
  number: string;
}

@Component({
  selector: 'b3n-form-information',
  templateUrl: './form-information.component.html',
  styleUrls: ['./form-information.component.scss']
})
export class FormInformationComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('inputName') inputName: ElementRef;

  @Input() isLoading: boolean;
  @Input() errorPhoneNumber: string;
  @Input() errorEmail: string;

  @Output() value = new EventEmitter<InformationCustomer>();

  authState$: Observable<SocialUser>;

  formGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    number: null
  });
  matcher = new MyErrorStateMatcher();
  isInboxFlow$: Observable<boolean>;

  get name() {
    return this.formGroup.get('name');
  }
  get email() {
    return this.formGroup.get('email');
  }

  get number() {
    return this.formGroup.get('number');
  }

  constructor(
    private fb: UntypedFormBuilder,
    private externalOAuthQuery: ExternalOAuthQuery,
    private externalOAuthService: ExternalOAuthService,
    private socialAuthService: SocialAuthService,
    private customersQuery: CustomersQuery
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['errorPhoneNumber']) {
      if (this.errorPhoneNumber) {
        this.number.setErrors({ errorPhoneNumber: true });
      } else {
        this.number.setErrors(null);
      }
    }
    if (changes['errorEmail']) {
      if (this.errorEmail) {
        this.email.setErrors({ errorEmail: true });
      } else {
        this.email.setErrors(null);
      }
    }
  }

  ngOnInit(): void {
    this.isInboxFlow$ = this.customersQuery.select('ui').pipe(map(x => x?.isInboxFlow));

    const data: LocalStorageLiveChat = LocalStorageUtil.getItem(`customerChatbot_${X.orgUuid}`);
    if (data && !data.hasGoogle) {
      this.formGroup.setValue({
        name: data?.name || '',
        email: data?.email || '',
        number: +data?.number
      });
    }

    this.authState$ = this.socialAuthService.authState.pipe(
      tap((user: SocialUser) => {
        if (user) {
          this.externalOAuthService
            .verifyLoginGoogle(<AuthenticationGoogle>{
              clientId: environment.clientIdGoogle,
              credential: user.idToken
            })
            .subscribe();
        }
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inputName?.nativeElement.focus();
    }, 0);
  }

  loginWithGoogle(): void {
    this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID).then(profile => {
      if (profile) {
        this.value.emit({
          email: profile.email,
          name: profile.name,
          number: undefined
        });
      }
    });
  }

  logOut(): void {
    this.socialAuthService.signOut();
    this.externalOAuthService.signOutGoogle();
  }

  startChat() {
    let req: InformationCustomer;
    const profile = this.externalOAuthQuery.getGoogle();
    if (this.externalOAuthQuery.getTokenSocial() && !!profile) {
      req = {
        email: profile.email,
        name: profile.name,
        number: null
      };
    } else {
      if (this.formGroup.invalid) {
        return;
      }
      const data = { ...this.formGroup.value };
      if (data.number) {
        data.number = '+' + data.number;
      }
      req = data;
    }

    this.value.emit(req);
  }
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}
