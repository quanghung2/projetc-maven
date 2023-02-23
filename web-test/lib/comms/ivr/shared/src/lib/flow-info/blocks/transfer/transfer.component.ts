import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { KeyValue } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import {
  BizPhoneConferenceRoom,
  BizphoneExt,
  BizphoneExtGroups,
  BizphoneService,
  BookingGroup,
  BookingService,
  CallcenterQueue,
  CallcenterService,
  CallerIdStrategyType,
  DestType,
  ExtensionType,
  TransferBlock
} from '@b3networks/api/ivr';
import * as _ from 'lodash';
import { forkJoin } from 'rxjs';
import { ValidCheckService } from '../../../core/service/valid-check.service';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { X } from '@b3networks/shared/common';

@Component({
  selector: 'b3n-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class TransferComponent implements OnInit, OnChanges, OnDestroy {
  private _isDevice: boolean;

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  extensionTypeOptions: KeyValue<ExtensionType, string>[] = [
    { key: ExtensionType.EXTENSION, value: 'Extension' },
    { key: ExtensionType.EXTENSION_GROUP, value: 'Extension Group' },
    { key: ExtensionType.CONFERENCE, value: 'Conference' }
  ];
  destOptions: KeyValue<DestType, string>[] = [
    { key: DestType.number, value: 'Phone Number' },
    { key: DestType.bizphone, value: 'Extension' },
    { key: DestType.callcenter, value: 'Call Center' }
  ];

  callerIdStrategyOptions: KeyValue<CallerIdStrategyType, string>[] = [
    {
      key: CallerIdStrategyType.displayCaller,
      value: 'Present Calling Party Number'
    },
    {
      key: CallerIdStrategyType.displayB3Number,
      value: 'Present Original Called Number'
    }
  ];
  isLicenseOrg: boolean;

  DestType = DestType;
  CallerIdStrategyType = CallerIdStrategyType;

  @Input() block: TransferBlock;
  @Input() set isDevice(device: boolean) {
    this._isDevice = device;
    if (this._isDevice) {
      this.destOptions = [
        { key: DestType.forwardBack2MSISDN, value: 'Physical SIM' },
        { key: DestType.number, value: 'Phone Number' },
        { key: DestType.bizphone, value: 'Extension' },
        { key: DestType.callcenter, value: 'Call Center' }
      ];
    }
  }

  get isDevice() {
    return this._isDevice;
  }

  bizPhoneExts: BizphoneExt[];
  bizPhoneExtGroups: BizphoneExtGroups[];
  bizPhoneConferenceRooms: BizPhoneConferenceRoom[];
  callCenterQueues: CallcenterQueue[];
  bookingGroups: BookingGroup[];
  bizPhoneExtMap: any = {};
  callCenterQueueMap: any = {};
  bookingGroupMap: any = {};

  selectedNumber: string;
  selectedExtensionType: ExtensionType;
  MAX_NUMBER_ADDED = 10;

  constructor(
    private bizPhoneService: BizphoneService,
    private callCenterService: CallcenterService,
    private bookingService: BookingService,
    private validCheckService: ValidCheckService,
    private profileQuery: IdentityProfileQuery
  ) {}

  ngOnInit() {
    forkJoin([this.bizPhoneService.findBizPhoneExtensions(), this.callCenterService.getCallCenterQueue()]).subscribe(
      data => {
        this.bizPhoneExts = data[0].extensions;
        this.bizPhoneExtGroups = data[0].extension_groups;
        this.bizPhoneConferenceRooms = data[0].conference_rooms;
        this.bizPhoneExtMap = _.keyBy(this.bizPhoneExts, (item: BizphoneExt) => {
          return item.extKey;
        });

        this.callCenterQueues = data[1];

        if (!this.block.callerIdStrategy.type) {
          this.block.callerIdStrategy.type = this.callerIdStrategyOptions[0].key;
        }
      }
    );

    this.bookingGroups = this.bookingService.getGroupList();
    this.callCenterQueueMap = this.callCenterService.getQueueMap();
    this.bookingGroupMap = this.bookingService.getGroupMap();
    this.isLicenseOrg = this.profileQuery.getProfileOrg(X.orgUuid)?.licenseEnabled;
    if (this.isLicenseOrg) {
      this.extensionTypeOptions.length = 2;
    }
  }

  ngOnDestroy() {
    this.validCheckService.setInvalidTransferForm(false);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.block.dest.orgUuid = this.block.orgUuid;
  }

  transferDestChange(value: DestType) {
    this.block.dest.type = value;
    if (this.block.dest.type !== DestType.number) {
      this.validCheckService.setInvalidTransferForm(false);
    }
  }

  addExt(ext: BizphoneExt) {
    this.block.dest.ext = ext.extKey;
    this.block.dest.extType = ExtensionType.EXTENSION;
  }

  addNumber() {
    if (!this.block.dest.numbers) {
      this.block.dest.numbers = [];
    }

    if (!this.selectedNumber.startsWith('+')) {
      this.selectedNumber = '+' + this.selectedNumber;
    }

    if (!this.block.dest.numbers.includes(this.selectedNumber)) {
      this.block.dest.numbers.push(this.selectedNumber);
    }
    this.block.dest.type = DestType.number;
    this.selectedNumber = '';
  }

  deleteNumber(number: string) {
    if (!this.block.dest.numbers) {
      this.block.dest.numbers = [];
    }

    if (number.toLowerCase() === 'all') {
      this.block.dest.numbers = [];
      return;
    }

    this.block.dest.numbers = _.filter(this.block.dest.numbers, item => {
      return item !== number;
    });
  }

  addExtGroup(extGroup: BizphoneExtGroups) {
    this.block.dest.ext = extGroup.extGroupKey;
    this.block.dest.extType = ExtensionType.EXTENSION_GROUP;
  }

  onChangeExtensionType(option) {
    this.selectedExtensionType = option.key;
  }

  addRoom(room) {}

  add(event: MatChipInputEvent) {
    const input = event.input;
    let value = event.value;

    if (!this.block.dest.numbers) {
      this.block.dest.numbers = [];
    }

    if (!!value && isNaN(Number(value))) {
      value = value.replace(/[^\d.-]|-|\./g, '');
    }

    if (!!value && !value.startsWith('+')) {
      value = '+' + value;
    }

    // Add our fruit
    if ((value || '').trim() && !this.block.dest.numbers.includes(value)) {
      this.block.dest.numbers.push(value);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
    this.block.dest.type = DestType.number;
  }

  remove(number: string) {
    const index = this.block.dest.numbers.indexOf(number);

    if (index >= 0) {
      this.block.dest.numbers.splice(index, 1);
    }
  }
}
