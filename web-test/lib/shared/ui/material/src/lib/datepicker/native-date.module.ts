import { NgModule } from '@angular/core';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NativeDateModule } from '@matheo/datepicker/core';
import { B3N_NATIVE_DATE_FORMATS } from './native-date-format';

@NgModule({
  imports: [NativeDateModule],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-SG' },
    { provide: MAT_DATE_FORMATS, useValue: B3N_NATIVE_DATE_FORMATS }
  ]
})
export class SharedUiMaterialNativeDateModule {}
