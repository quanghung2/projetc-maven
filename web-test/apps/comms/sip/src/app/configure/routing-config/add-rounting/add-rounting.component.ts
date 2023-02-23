import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  CacheService,
  EnumTypeForwardTo,
  EnumTypeRouting,
  EventStreamService,
  RoutingService
} from './../../../shared';

declare let X: any;
declare let $: any;

@Component({
  selector: 'app-add-rounting',
  templateUrl: './add-rounting.component.html',
  styleUrls: ['./add-rounting.component.scss']
})
export class AddRountingComponent implements OnInit, OnDestroy {
  @ViewChild('typeInput', { static: true }) typeInput: ElementRef;
  @ViewChild('forwardInput', { static: true }) forwardInput: ElementRef;

  currentAccount: any;
  ui = {
    isSaving: false,
    sipUsername: null,
    type: EnumTypeRouting.outgoing,
    rule: '',
    forwardTo: <string>EnumTypeForwardTo.sip,
    sipValue: [],
    extValue: '',
    e164: ''
  };
  EnumTypeRouting = EnumTypeRouting;
  EnumTypeForwardTo = EnumTypeForwardTo;
  errorMessages = {
    formatSIP: 'Ex: sip1234567@abc.xyz!'
  };
  validators = [checkValidator.bind(this)];

  private arrSubscription = new Array<Subscription>();

  get isDisableForm() {
    if (this.ui.forwardTo === EnumTypeForwardTo.extension && (!this.ui.extValue || this.ui.extValue === '')) {
      return true;
    }
    if (this.ui.forwardTo === EnumTypeForwardTo.sip && this.ui.sipValue.length === 0) {
      return true;
    }
    if (this.ui.forwardTo === EnumTypeForwardTo.e164 && !this.ui.e164) {
      return true;
    }
    if (this.ui.rule === '') {
      return true;
    }
    return false;
  }

  constructor(
    private eventStreamService: EventStreamService,
    private cacheService: CacheService,
    private routingService: RoutingService
  ) {}

  ngOnInit(): void {
    this.arrSubscription.push(
      this.eventStreamService.on('open-modal').subscribe(res => {
        this.resertUI();
        if (res === 'add-routing-modal') {
          const cache = this.cacheService.get('current-account');
          this.ui.sipUsername = cache.account.username;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.arrSubscription.forEach(sub => {
      sub.unsubscribe();
    });
  }

  onCreate() {
    const body = Object.assign({}, this.ui);
    if (body.forwardTo === EnumTypeForwardTo.sip) {
      body.sipValue = body.sipValue.map(sip => `sip:${sip.value.trim()}`);
      body.forwardTo = body.sipValue.join(';');
    } else if (body.forwardTo === EnumTypeForwardTo.extension) {
      body.forwardTo = `ext:${body.extValue}`;
    } else {
      body.forwardTo = body.e164.trim();
    }

    this.ui.isSaving = true;
    this.routingService
      .postRouting(this.ui.sipUsername, body)
      .pipe(finalize(() => (this.ui.isSaving = false)))
      .subscribe(
        data => {
          this.eventStreamService.trigger('close-modal', 'add-routing-modal');
          this.eventStreamService.trigger('close-modal:add-routing-modal', data);
          this.resertUI();
        },
        err => X.showWarn(err.message)
      );
  }

  private resertUI() {
    this.ui = {
      isSaving: false,
      sipUsername: null,
      type: EnumTypeRouting.outgoing,
      rule: '',
      forwardTo: EnumTypeForwardTo.sip,
      sipValue: [],
      extValue: '',
      e164: ''
    };

    try {
      setTimeout(() => {
        $(this.typeInput.nativeElement)
          .find('.ui.dropdown')
          .dropdown('set text', this.ui.type === EnumTypeRouting.outgoing ? 'Outgoing' : 'ISDN Incoming');
        $(this.forwardInput.nativeElement).find('.ui.dropdown').dropdown('set text', 'SIP');
      }, 100);
    } catch (e) {
      console.error(e);
    }
  }
}

export const formatSIP = /^sip[a-zA-Z0-9][a-zA-Z0-9_\.]{0,32}@[a-zA-Z0-9]{1,32}(\.[a-zA-Z0-9]{1,32}){1,32}$/gi;
export function checkValidator(control: UntypedFormControl) {
  const value = control.value.trim();
  if (!value) {
    return null;
  }
  if (!value.match(formatSIP)) {
    return { formatSIP: true };
  }
  return null;
}
