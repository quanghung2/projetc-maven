import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { Inject, Injectable, Injector } from '@angular/core';
import { ToastConfig, TOAST_CONFIG_TOKEN } from '../config/toast-configs';
import { ToastRef } from '../config/toast-ref';
import { ToastComponent, ToastData } from '../toast.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private lastToast?: ToastRef;

  constructor(
    private overlay: Overlay,
    private parentInjector: Injector,
    @Inject(TOAST_CONFIG_TOKEN) public toastConfig: ToastConfig
  ) {}

  success(message: string, duration?: number) {
    console.log(message)
    const positionStrategy = this.getPositionStrategy();
    const overlayRef = this.overlay.create({ positionStrategy });

    const toastRef = new ToastRef(overlayRef);
    this.lastToast = toastRef;
    const data = new ToastData();
    data.message = message;
    data.type = 'success';
    data.duration = duration ? duration : 3000;
    const injector = this.getInjector(data, toastRef, this.parentInjector);
    const toastPortal = new ComponentPortal(ToastComponent, null, injector);

    overlayRef.attach(toastPortal);

    return toastRef;
  }

  warning(message: string, duration?: number) {
    const positionStrategy = this.getPositionStrategy();
    const overlayRef = this.overlay.create({ positionStrategy });

    const toastRef = new ToastRef(overlayRef);
    this.lastToast = toastRef;
    const data = new ToastData();
    data.message = message;
    data.type = 'warning';
    data.duration = duration ? duration : 3000;
    const injector = this.getInjector(data, toastRef, this.parentInjector);
    const toastPortal = new ComponentPortal(ToastComponent, null, injector);

    overlayRef.attach(toastPortal);

    return toastRef;
  }

  error(message: string, duration?: number) {
    console.log(message)
    const positionStrategy = this.getPositionStrategy();
    const overlayRef = this.overlay.create({ positionStrategy });

    const toastRef = new ToastRef(overlayRef);
    this.lastToast = toastRef;
    const data = new ToastData();
    data.message = message;
    data.type = 'error';
    data.duration = duration ? duration : 5000;
    const injector = this.getInjector(data, toastRef, this.parentInjector);
    const toastPortal = new ComponentPortal(ToastComponent, null, injector);

    overlayRef.attach(toastPortal);

    return toastRef;
  }

  getPositionStrategy() {
    return this.overlay
      .position()
      .global()
      .top(this.getPosition())
      .right((this.toastConfig && this.toastConfig.position ? this.toastConfig.position.right : 20) + 'px');
  }

  getPosition() {
    const lastToastIsVisible = this.lastToast && this.lastToast.isVisible();
    const position = lastToastIsVisible
      ? this.lastToast?.getPosition().bottom
      : this.toastConfig && this.toastConfig.position
      ? this.toastConfig.position.top
      : 20;

    return position + 'px';
  }

  getInjector(data: ToastData, toastRef: ToastRef, parentInjector: Injector) {
    const tokens = new WeakMap();

    tokens.set(ToastData, data);
    tokens.set(ToastRef, toastRef);

    return new PortalInjector(parentInjector, tokens);
  }
}
