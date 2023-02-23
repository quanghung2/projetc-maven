import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppGlobal {
  readonly blockTypeMap: any = {
    gather: 'Gather input',
    transfer: 'Transfer call',
    notification: 'Record call and notify',
    play: 'Play message only',
    go: 'Forward to',
    condition: 'Set condition',
    confirmation: 'Confirm',
    webhook: 'Webhook',
    monitor: 'Monitor call',
    genie: 'Genie'
  };

  readonly appNameMap: any = {
    '': {
      name: 'All Apps',
      icon: ''
    },
    uQwJTR1g9NLKNASU: {
      name: 'Extensions',
      icon: 'https://d2hlei1umhw6cd.cloudfront.net/images/app-logo/bizphone_128x128.png'
    },
    '4ESLmjmXaWH0jcxT': {
      name: 'Virtual Line',
      icon: 'https://d2hlei1umhw6cd.cloudfront.net/icons/virtualline_128x128_2.png'
    },
    kKA37jWkNjbzYSPD: {
      name: 'Virtual Line Beta',
      icon: 'https://d2hlei1umhw6cd.cloudfront.net/icons/virtualline_128x128_2.png'
    },
    GKraxgaqym78X2uY: {
      name: 'Numbers',
      icon: 'https://apps-local.s3.amazonaws.com/directline/dev/logo/1544167893996-icn_directLine_128.png'
    },
    Y4v35i2TXBM0XL2l: {
      name: 'Call Center',
      icon: 'https://apps-local.s3.amazonaws.com/directline/dev/logo/1490582116190-Wallboard_512x512.png'
    }
  };
}
