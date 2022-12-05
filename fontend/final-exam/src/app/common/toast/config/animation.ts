import { animate, AnimationTriggerMetadata, state, style, transition, trigger } from '@angular/animations';

export const toastAnimations: {
  readonly fadeToast: AnimationTriggerMetadata;
} = {
  fadeToast: trigger('fadeAnimation', [
    state('default', style({ transform: 'scale(1.0)' })),
    transition('void => *', [style({ transform: 'translateY(-20px)' }), animate('{{ fadeIn }}ms')]),
    transition('default => closing', animate('{{ fadeOut }}ms', style({ transform: 'translateY(-20px)' })))
  ])
};

export type ToastAnimationState = 'default' | 'closing';
