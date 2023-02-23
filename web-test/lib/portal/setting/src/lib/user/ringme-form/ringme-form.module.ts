import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RingmeFormComponent } from './ringme-form.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [RingmeFormComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule
  ],
  exports: [RingmeFormComponent]
})
export class RingmeFormModule { }
