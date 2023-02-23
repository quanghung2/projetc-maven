import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { IdentityProfile, Timezone, TimezoneQuery, TimezoneService, UpdatePersonalRequest } from '@b3networks/api/auth';
import { SessionQuery, SessionService } from '@b3networks/portal/base/shared';
import { DestroySubscriberComponent, MessageConstants } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, Observable } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-account-information-settings',
  templateUrl: 'information.component.html',
  styleUrls: ['information.component.scss']
})
export class AccountInformationSettingsComponent extends DestroySubscriberComponent implements OnInit {
  profile: IdentityProfile;

  uploadIndicator = false;
  timezones$: Observable<Timezone[]>;

  profileFG: UntypedFormGroup;
  photoUrl: string;

  progressing: boolean;

  displayNameOptions: KeyValue<boolean, string>[] = [];

  constructor(
    private sessionQuery: SessionQuery,
    private sessionService: SessionService,
    private toastService: ToastService,
    private timezoneService: TimezoneService,
    private timezoneQuery: TimezoneQuery,
    private fb: UntypedFormBuilder
  ) {
    super();
  }

  ngOnInit() {
    this.initControlls();
    this.sessionQuery.profile$
      .pipe(
        filter(p => p != null && !!p.uuid),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(profile => {
        console.log(profile);

        this.profile = profile;
        this.profileFG.get('givenName').setValue(profile.givenName);
        this.profileFG.get('familyName').setValue(profile.familyName);
        this.profileFG.get('timezoneUuid').setValue(profile.timezone);
        this.profileFG.get('about').setValue(profile.about);
        this.profileFG
          .get('inverse')
          .setValue(profile.displayName === `${profile.givenName} ${profile.familyName}` ? false : true);
        this.photoUrl = profile.photoSrc;
      });

    this.timezones$ = this.timezoneQuery.timezone$;
    this.timezoneService.getTimezone().subscribe();
  }

  updatePersonal() {
    this.progressing = true;

    const payload = this.profileFG.value as UpdatePersonalRequest;
    payload.photoUrl = this.photoUrl;

    this.sessionService.updatePersonalInfo(payload).subscribe(
      _ => {
        this.progressing = false;
        this.toastService.success('Your profile has been successfully updated.');
      },
      error => {
        this.progressing = false;
        const err = error.error;
        if (err.code === 'auth.emailAlreadyRegistered') {
          this.toastService.warning('Email already registered in the system. Please use a different one.');
        } else {
          this.toastService.warning(MessageConstants.GENERAL_ERROR);
        }
      }
    );
  }

  displayNameOptTrackbyFunc(item: KeyValue<boolean, string>) {
    return item ? item.key : null;
  }

  private initControlls() {
    this.profileFG = this.fb.group({
      givenName: [null, [Validators.required, Validators.minLength(1)]],
      familyName: [null, [Validators.required, Validators.minLength(1)]],
      inverse: [false],
      displayName: [null],
      timezoneUuid: [null, [Validators.required]],
      about: [null, [Validators.maxLength(200)]]
    });

    combineLatest([
      this.profileFG.get('givenName').valueChanges,
      this.profileFG.get('familyName').valueChanges,
      this.profileFG.get('inverse').valueChanges
    ]).subscribe(([givenName, familyName, inverse]) => {
      this.displayNameOptions = [
        { key: false, value: givenName + ' ' + familyName },
        { key: true, value: familyName + ' ' + givenName }
      ];

      const displayName = inverse ? `${familyName} ${givenName}` : `${givenName} ${familyName}`;
      this.profileFG.get('displayName').setValue(displayName);
    });
  }
}
