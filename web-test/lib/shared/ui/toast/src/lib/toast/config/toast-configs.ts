import { InjectionToken } from '@angular/core';

export class ToastConfig {
  position?: {
    top: number;
    right: number;
  };
  animation?: {
    fadeOut: number;
    fadeIn: number;
  };
}

export const defaultToastConfig: ToastConfig = {
  position: {
    top: 20,
    right: 20
  },
  animation: {
    fadeOut: 250,
    fadeIn: 150
  }
};
export const TOAST_CONFIG_TOKEN = new InjectionToken('toast-config');
