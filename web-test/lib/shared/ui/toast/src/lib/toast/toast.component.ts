import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { toastAnimations, ToastAnimationState } from './config/animation';
import { ToastConfig, TOAST_CONFIG_TOKEN } from './config/toast-configs';
import { ToastRef } from './config/toast-ref';

export class ToastData {
  message?: string;
  type?: ToastType;
  duration?: number;
}

export type ToastType = 'error' | 'warning' | 'success';

@Component({
  selector: 'b3n-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  animations: [toastAnimations.fadeToast]
})
export class ToastComponent implements OnInit, OnDestroy {
  animationState: ToastAnimationState = 'default';
  toastType?: ToastType;
  intervalId: any;

  constructor(
    readonly data: ToastData,
    readonly ref: ToastRef,
    @Inject(TOAST_CONFIG_TOKEN) public toastConfig: ToastConfig
  ) {
    this.toastType = data.type;
  }

  ngOnInit() {
    this.intervalId = setTimeout(() => this.close(), this.data.duration);
  }

  ngOnDestroy() {
    clearTimeout(this.intervalId);
  }

  close() {
    this.ref.close();
  }

  onFadeFinished(event: any) {
    const { toState } = event;
    const isFadeOut = (toState as ToastAnimationState) === 'closing';
    const itFinished = this.animationState === 'closing';

    if (isFadeOut && itFinished) {
      this.close();
    }
  }
}
