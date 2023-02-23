import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ClipboardModule } from 'ngx-clipboard';
import { NgxMaskModule } from 'ngx-mask';
import { CopyButtonComponent } from './component/copy-button/copy-button.component';
import { InfiniteScrollComponent } from './component/infinite-scroll/infinite-scroll.component';
import { PhoneNumberComponent } from './component/phone-number/phone-number.component';
import { ResourceNotFoundComponent } from './component/resource-not-found/resource-not-found.component';
import { AlphanumbericKeydownDirective } from './directive/alphanumberic-keydown.directive';
import { InputNumberKeydownDirective } from './directive/input-number-keydown.directive';
import { LazyImgDirective } from './directive/lazy-img.directive';
import { MinDirective } from './directive/min-validator.directive';
import { RetrictInputDirective } from './directive/retrict-input.directive';
import { ScrollEventDirective } from './directive/scroll-event.directive';
import { CamelTitlePipe } from './pipe/camel-title.pipe';
import { CapitalizeCasePipe } from './pipe/capitalize-case.pipe';
import { ConsentStatusPipe } from './pipe/consent-status.pipe';
import { DistanceToNowPipe } from './pipe/distance-now.pipe';
import { DNCStatusPipe } from './pipe/dnc-status.pipe';
import { DurationPipe } from './pipe/duration.pipe';
import { ExtDevicePipe } from './pipe/ext-device.pipe';
import { FileSizePipe } from './pipe/file-size.pipe';
import { FirstWordPipe } from './pipe/first-word.pipe';
import { HighlightPipe } from './pipe/highlight.pipe';
import { InstanceofPipe } from './pipe/instance-of.pipe';
import { LinkifyPipe } from './pipe/linkify.pipe';
import { ListFilterPipe } from './pipe/list-filter.pipe';
import { ReplacePipe } from './pipe/replace';
import { ReplaceSpecialCharacterPipe } from './pipe/replace-special-character.pipe';
import { SafePipe } from './pipe/safe.pipe';
import { SentenceCasePipe } from './pipe/sentence-case.pipe';
import { SplitTextPipe } from './pipe/text-split.pipe';
import { TimeAgoPipe } from './pipe/time-ago.pipe';
import { TimeDurationPipe } from './pipe/time-duration.pipe';
import { TodayPipe } from './pipe/today.pipe';
import { TransferCallerIDPipe } from './pipe/transfer-callerid.pipe';
import { TruncatePipe } from './pipe/truncate.pipe';
import { ViewDatePipe } from './pipe/view-date.pipe';
import { MaxLengthDirective } from './directive/max-length-validator.directive';
import { PermissibleLimitsDirective } from './directive/permissible-limits-validator.directive';

const PIPES = [
  DurationPipe,
  TimeDurationPipe,
  TruncatePipe,
  TransferCallerIDPipe,
  TimeAgoPipe,
  SplitTextPipe,
  CamelTitlePipe,
  SafePipe,
  FirstWordPipe,
  ReplaceSpecialCharacterPipe,
  ListFilterPipe,
  HighlightPipe,
  SentenceCasePipe,
  ExtDevicePipe,
  ViewDatePipe,
  CapitalizeCasePipe,
  TodayPipe,
  ReplacePipe,
  DistanceToNowPipe,
  FileSizePipe,
  DNCStatusPipe,
  ConsentStatusPipe,
  InstanceofPipe,
  LinkifyPipe
];

const DIRECTIVES = [
  ScrollEventDirective,
  RetrictInputDirective,
  LazyImgDirective,
  MinDirective,
  InputNumberKeydownDirective,
  AlphanumbericKeydownDirective,
  MaxLengthDirective,
  PermissibleLimitsDirective
];

const COMPONENTS = [InfiniteScrollComponent, PhoneNumberComponent, CopyButtonComponent, ResourceNotFoundComponent];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    SharedUiMaterialModule,
    NgxMaskModule.forRoot()
  ],
  declarations: [PIPES, DIRECTIVES, COMPONENTS],
  providers: [PIPES, DIRECTIVES],
  exports: [ClipboardModule, PIPES, DIRECTIVES, COMPONENTS, FormsModule, ReactiveFormsModule]
})
export class SharedCommonModule {}
