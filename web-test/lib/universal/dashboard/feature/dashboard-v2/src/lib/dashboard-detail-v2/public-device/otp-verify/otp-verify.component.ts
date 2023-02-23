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
import { FormControl } from '@angular/forms';
import { DashboardV2Service, PublicDevice } from '@b3networks/api/dashboard';
import { DEFAULT_WARNING_MESSAGE } from '@b3networks/portal/setting';
import { DestroySubscriberComponent, DomainUtilsService } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { firstValueFrom, takeUntil } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DeviceVerifyForm, OtpVerifyForm } from '../public-device.component';

const MAX_DIGIT = 1;
const MAX_NAME_CHAR = 30;

@Component({
  selector: 'b3n-otp-verify',
  templateUrl: './otp-verify.component.html',
  styleUrls: ['./otp-verify.component.scss']
})
export class OtpVerifyComponent extends DestroySubscriberComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() otpVerifyForm: OtpVerifyForm;
  @Input() deviceVerifyForm: DeviceVerifyForm;
  @Input() loading: boolean;
  @Input() invalid: boolean;
  @Input() verifiedDevice: PublicDevice;

  @Output() submit = new EventEmitter<any>();
  @Output() close = new EventEmitter<any>();

  @ViewChild('digit0', { static: true }) digit0Input: ElementRef;
  @ViewChild('digit1', { static: true }) digit1Input: ElementRef;
  @ViewChild('digit2', { static: true }) digit2Input: ElementRef;
  @ViewChild('digit3', { static: true }) digit3Input: ElementRef;
  @ViewChild('digit4', { static: true }) digit4Input: ElementRef;
  @ViewChild('digit5', { static: true }) digit5Input: ElementRef;
  @ViewChild('nameInput', { static: true }) nameInput: ElementRef;

  readonly MAX_NAME_CHAR = MAX_NAME_CHAR;

  remainNameChar = MAX_NAME_CHAR;
  updating: boolean;
  portalLink: string;

  constructor(
    private dashboardV2Service: DashboardV2Service,
    private toastService: ToastService,
    private domainUtilsService: DomainUtilsService
  ) {
    super();
    this.portalLink = `https://${this.domainUtilsService.getPortalDomain()}/tv`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loading'] && changes['loading'].previousValue && !changes['loading'].currentValue) {
      this.focusFirstInput();
    }

    if (changes['verifiedDevice'] && changes['verifiedDevice'].currentValue) {
      setTimeout(() => {
        this.nameInput.nativeElement.focus();
      }, 0);
    }
  }

  ngOnInit(): void {
    Object.entries(this.otpVerifyForm.controls).forEach(([_, digitFC], index) => {
      this.handleDigit(digitFC, index);
    });

    this.name.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(value => {
          if (value.length > this.MAX_NAME_CHAR) {
            const valid = value.slice(0, this.MAX_NAME_CHAR);
            this.name.setValue(valid);
            this.remainNameChar = 0;
          } else {
            this.remainNameChar = this.MAX_NAME_CHAR - value.length;
          }
        })
      )
      .subscribe();
  }

  handleDigit(digitFC: FormControl, index: number) {
    digitFC.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(value => {
          if (value === null) {
            digitFC.setValue('');
            return;
          }

          if (value === '') {
            return;
          }

          if (value.length === MAX_DIGIT) {
            const digitObj = this.otpVerifyForm.getRawValue();
            const otp = Object.values(digitObj).join('');

            if (otp.length === 6) {
              this.submit.emit();
              return;
            }

            if (index === Object.entries(this.otpVerifyForm.controls).length - 1) {
              return;
            }

            this.focusDigitInput(index + 1);
            return;
          }

          const valid = value.slice(0, MAX_DIGIT);
          digitFC.setValue(valid);
        })
      )
      .subscribe();
  }

  focusDigitInput(index: number) {
    let digitInput: ElementRef;

    switch (index) {
      case 0:
        digitInput = this.digit0Input;
        break;
      case 1:
        digitInput = this.digit1Input;
        break;
      case 2:
        digitInput = this.digit2Input;
        break;
      case 3:
        digitInput = this.digit3Input;
        break;
      case 4:
        digitInput = this.digit4Input;
        break;
      case 5:
        digitInput = this.digit5Input;
        break;
      default:
        digitInput = null;
        break;
    }

    if (digitInput) {
      digitInput.nativeElement.focus();
    }
  }

  ngAfterViewInit(): void {
    this.focusFirstInput();
  }

  focusFirstInput() {
    setTimeout(() => {
      this.digit0Input.nativeElement.focus();
    }, 0);
  }

  async updateDevice() {
    this.updating = true;

    try {
      await firstValueFrom(
        this.dashboardV2Service.updateDevice(this.verifiedDevice.deviceId, { deviceName: this.name.value })
      );
      this.toastService.success(`Update successfully`);
      this.close.emit();
    } catch (e) {
      this.toastService.error(e['message'] ?? DEFAULT_WARNING_MESSAGE);
    } finally {
      this.updating = false;
    }
  }

  get digit0() {
    return this.otpVerifyForm.controls['digit0'];
  }

  get name() {
    return this.deviceVerifyForm.controls['name'];
  }
}
