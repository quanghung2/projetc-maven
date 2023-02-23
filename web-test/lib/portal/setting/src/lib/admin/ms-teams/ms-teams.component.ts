import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MsTeamAuthService, OrganizationService, Subscription } from '@b3networks/api/auth';
import { ExtensionService } from '@b3networks/api/bizphone';
import { Device, MsTeamCallCenterService } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import {
  DirectRoutingExtension,
  DirectRoutingReq,
  FetchTypeNumber,
  GetOperatorConnectNumbersReq,
  LicenseDirectRoutingService,
  LicenseOperatorConnectNumberService,
  OperatorConnectNumbers
} from '@b3networks/api/license';
import { DestroySubscriberComponent, MessageConstants, X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime, finalize, startWith, takeUntil } from 'rxjs/operators';
import { ADMIN_LINK } from '../../shared/contants';
import {
  ActivateLicenseDialogComponent,
  ActivateLicenseDialogData
} from './activate-license-dialog/activate-license-dialog.component';
import { CheckProvisionComponent } from './check-provision/check-provision.component';
import {
  LinkMsAccountDialogComponent,
  LinkMsAccountDialogData
} from './link-ms-account-dialog/link-ms-account-dialog.component';
import { MassConfigurationDialogComponent } from './mass-configuration-dialog/mass-configuration-dialog.component';
import { MsScriptDialogComponent } from './ms-script-dialog/ms-script-dialog.component';
import { ProfileDialogComponent, ProfileDialogData } from './profile-dialog/profile-dialog.component';
import { RevokeMsAuthComponent } from './revoke-ms-auth/revoke-ms-auth.component';
import { SupportedSkuIds } from './supported-sku-ids.const';

const DEFAULT_ANY_NODE_DOMAIN = 'sbc3.b3networks.com';
const DEMO_ANY_NODE_DOMAIN = 'sbc4.b3networks.com';

@Component({
  selector: 'b3n-bp-teams',
  templateUrl: './ms-teams.component.html',
  styleUrls: ['./ms-teams.component.scss']
})
export class MsTeamsComponent extends DestroySubscriberComponent implements OnInit {
  private readonly supportedSkuIds = SupportedSkuIds;

  readonly lstFetchTypeNumber = [
    { key: FetchTypeNumber.fetchAll, value: 'All' },
    { key: FetchTypeNumber.fetchUploaded, value: 'Uploaded' },
    { key: FetchTypeNumber.fetchNotUploaded, value: 'Not Uploaded' },
    { key: FetchTypeNumber.fetchFailedUploaded, value: 'Failed' }
  ];

  filterForm: UntypedFormGroup;

  hasConnectToMsPortal: boolean;
  txtKey: string;
  txtValue: string;

  subscriptions: Subscription[] = [];
  selectedSKUIds: string;

  warningMessage: string;
  errorMessage: string;

  isVerifyFinish = false;
  isWaitingForVerifying: boolean;
  isLoading = true;
  isLoadingNumber = true;
  isUploadingNumber = false;
  isProvisioningDevices = false;
  numberLoadding: string;
  extLoadding: string;

  dataSource = new MatTableDataSource<DirectRoutingExtension>([]);
  dataSourceNumbers = new MatTableDataSource<OperatorConnectNumbers>([]);
  displayedColumns = ['checked', 'name', 'extension', 'DDI', 'provision', 'action'];
  displayedColumnsNumbers = ['checked', 'number', 'assignedNumber', 'status', 'uploadedAt', 'assignedAt'];

  number$: Observable<OperatorConnectNumbers[]>;
  operatorConnectNumbers: OperatorConnectNumbers[];
  operatorConnectNumberslength = 0;

  checkedNumbers: OperatorConnectNumbers[] = [];
  checkedExtensions: DirectRoutingExtension[] = [];
  directRoutingExtensions: DirectRoutingExtension[] = [];
  directRoutingExtensionsCount: number;
  devices: Device[];

  @ViewChild('directRoutingPaginator') directRoutingPaginator: MatPaginator;
  @ViewChild('numbersPaginator') numbersPaginator: MatPaginator;

  automatedActivationFailed: boolean;
  errorMessageWhenInit: string;
  clientId: string;
  isTryAgain: boolean;

  pageable = <Pageable>{ page: 0, perPage: 10 };
  pageableDirectRouting = <Pageable>{ page: 0, perPage: 10 };
  pageableExt = <Pageable>{ page: 0, perPage: 10 };

  searchQuery: UntypedFormControl = new UntypedFormControl();
  directRouting: DirectRoutingExtension[];
  directRoutingNotProvision: DirectRoutingExtension[];
  isEnblingDirectRouting = false;
  enabledDirectRouting = false;
  sbcDomain: string;
  usingDelecatedSBC: boolean;
  usingConnectWithoutMS = false;
  directRoutingMode: 'connectWithMS' | 'connectWithoutMS';
  isDirectRouting = true;
  type: 'ADMIN' | 'DEMO' | 'CUSTOMER';

  get isAllNumberChecked(): boolean {
    if (this.operatorConnectNumbers && this.operatorConnectNumbers.length) {
      return this.operatorConnectNumbers.length == this.checkedNumbers.length;
    }
    return false;
  }

  get isAllExtensionChecked(): boolean {
    if (this.directRoutingNotProvision && this.directRoutingNotProvision.length) {
      return this.directRoutingNotProvision.length == this.checkedExtensions.length;
    }
    return false;
  }

  constructor(
    private msTeamAuthService: MsTeamAuthService,
    private licenseOperatorConnectNumberService: LicenseOperatorConnectNumberService,
    private msTeamCallCenterService: MsTeamCallCenterService,
    private organizationService: OrganizationService,
    private extensionService: ExtensionService,
    private toastService: ToastService,
    private fb: UntypedFormBuilder,
    private licenseDirectRoutingService: LicenseDirectRoutingService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.organizationService.getOrganizationByUuid(X.orgUuid, false, true).subscribe(org => {
      if (org.msTeamsTenant?.tenantId) {
        this.isDirectRouting = false;
        this.initOperatorConnectNumbers();
      } else {
        this.type = org.type;
        this.initDirectRouting();
      }
    });
  }

  initOperatorConnectNumbers() {
    this.filterForm = this.fb.group({
      keyword: '',
      fetchType: 'fetchAll',
      numberSelected: false
    });

    this.filterForm.valueChanges
      .pipe(startWith(''), debounceTime(200), takeUntil(this.destroySubscriber$))
      .subscribe(value => {
        this.getOperatorConnectNumbers();
      });
  }

  initDirectRouting() {
    this.msTeamCallCenterService
      .getTeam()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(teamInfo => {
        if (teamInfo) {
          this.txtKey = teamInfo.dnsTxtRecordKey;
          if (!!teamInfo.teamId) {
            this.usingConnectWithoutMS = true;
            this.getDirectRoutings();
            this.getOAuthStatus();
          }
        }
      });
  }

  getOAuthStatus() {
    this.msTeamAuthService
      .getOAuthStatus()
      .pipe(
        finalize(() => {
          this.enabledDirectRouting = true;
          this.isEnblingDirectRouting = false;
        })
      )
      .subscribe(
        domainInfo => {
          this.hasConnectToMsPortal = !!(domainInfo && domainInfo.lastUpdatedDateTime);
          this.clientId = this.hasConnectToMsPortal ? domainInfo.clientId : null;
          if (!this.usingConnectWithoutMS && this.hasConnectToMsPortal) {
            if (domainInfo.domains && domainInfo.domains.length) {
              this.txtValue = domainInfo.domains[0].verificationDnsRecords?.find(record => record.text).text;

              const domainStatus = domainInfo.domains[0].status;

              if (domainStatus === 'UNVERIFIED') {
                this.updateTXTRecordOnRoute53();
              } else if (domainStatus === 'VERIFIED' || domainStatus === 'ACTIVATED') {
                this.isVerifyFinish = true;
                this.getDirectRoutings();
              }
            } else {
              this.addDomain();
            }
          }
        },
        error => {
          this.isLoading = false;
          this.errorMessageWhenInit = error && error.message ? error.message : MessageConstants.GENERAL_ERROR;
        }
      );
  }

  enableDirectRouting() {
    this.isEnblingDirectRouting = true;
    let directRoutingReq = <DirectRoutingReq>{};
    if (this.directRoutingMode === 'connectWithoutMS' && this.usingDelecatedSBC) {
      const domains = this.sbcDomain.split('.');
      const teamId = domains.length > 1 ? domains[0] : null;
      const anyNodeDomain = teamId ? this.sbcDomain.substring(teamId.length + 1) : this.sbcDomain;
      directRoutingReq = {
        teamId: teamId,
        anyNodeDomain: anyNodeDomain
      };
    } else {
      directRoutingReq = {
        anyNodeDomain: this.type === 'DEMO' ? DEMO_ANY_NODE_DOMAIN : DEFAULT_ANY_NODE_DOMAIN
      };
    }

    this.licenseDirectRoutingService
      .createDirectRouting(directRoutingReq)
      .pipe(
        finalize(() => {
          this.isEnblingDirectRouting = false;
        })
      )
      .subscribe(
        teamInfo => {
          if (this.directRoutingMode === 'connectWithMS') {
            this.txtKey = teamInfo.dnsTxtRecordKey;
            this.getOAuthStatus();
          } else {
            this.usingConnectWithoutMS = true;
            this.getDirectRoutings();
          }
          this.enabledDirectRouting = true;
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  getDirectRoutings() {
    this.licenseDirectRoutingService
      .getDirectRoutings(this.pageableDirectRouting)
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(res => {
        this.directRoutingExtensions = res.content;
        this.directRoutingNotProvision = res.content.filter(directRouting => !directRouting.isProvisionedToAnynode);
        this.directRoutingExtensionsCount = res.totalCount;
        this.dataSource = new MatTableDataSource<DirectRoutingExtension>(this.directRoutingExtensions);
        this.dataSource.paginator = this.directRoutingPaginator;
      });
  }

  getOperatorConnectNumbers() {
    const searchQuery = this.filterForm.value;
    this.isLoadingNumber = true;
    this.licenseOperatorConnectNumberService
      .getOperatorConnectNumbers(
        <GetOperatorConnectNumbersReq>{
          fetchType: searchQuery?.fetchType,
          sort: 'DESC',
          keyword: searchQuery?.keyword
        },
        this.pageable
      )
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => {
          this.isLoadingNumber = false;
          this.isLoading = false;
        })
      )
      .subscribe(numbers => {
        if (numbers.totalCount > 0) {
          this.operatorConnectNumberslength = numbers.totalCount;
          this.operatorConnectNumbers = numbers.content;
          const uuids = this.operatorConnectNumbers.map(n => {
            return n.identityUuid;
          });
          this.pageableExt.perPage = uuids.length;
          this.extensionService
            .getAssignedExtensions(uuids, this.pageableExt)
            .pipe(takeUntil(this.destroySubscriber$))
            .subscribe(exts => {
              this.operatorConnectNumbers.forEach(n => {
                const foundExt = exts.find(e => e.identityUuid === n.identityUuid);
                if (foundExt) {
                  n.extKey = foundExt.extKey;
                  n.extLabel = foundExt.extLabel;
                }
              });
              this.showSelectedNumbers(searchQuery?.numberSelected);
            });
        } else {
          this.dataSourceNumbers = new MatTableDataSource<OperatorConnectNumbers>([]);
          this.dataSourceNumbers.paginator = this.numbersPaginator;
        }
      });
  }

  enableMSConnector() {
    const originURL = location.href + `?menu=${ADMIN_LINK.microsoftTeams}`;

    this.isLoading = true;
    this.msTeamAuthService
      .enable(originURL)
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(urlResponse => {
        if (urlResponse && urlResponse.url) {
          window.open(urlResponse.url);
        }
      });
  }

  verifyDomain() {
    this.isLoading = true;
    this.msTeamAuthService
      .verifyDomain(this.txtKey)
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(
        _ => {
          this.isWaitingForVerifying = true;
          this.warningMessage = 'Please wait. This domain is being verified. This process may take up to 24 hours.';
        },
        err => {
          this.warningMessage = err?.message ? err.message : err;
        }
      );
  }

  private getSubscriptions() {
    this.isLoading = true;
    this.msTeamAuthService
      .getSubscriptions()
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(availableSKUs => {
        availableSKUs.forEach(sku => {
          if (this.supportedSkuIds.includes(sku.skuId)) {
            this.subscriptions.push(sku);
          }
        });

        if (this.subscriptions.length) {
          this.selectedSKUIds = this.subscriptions[0].skuId;
          this.assignLicense();
        } else {
          this.automatedActivationFailed = true;
          this.isVerifyFinish = true;
          this.getDirectRoutings();
          this.subscriptions = availableSKUs;
        }
      });
  }

  assignLicense() {
    this.isLoading = true;
    this.msTeamAuthService
      .assignDomainLicence(this.selectedSKUIds, this.txtKey)
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => {
          this.isLoading = false;
          this.isVerifyFinish = true;
          this.getDirectRoutings();
        })
      )
      .subscribe(
        () => {
          this.toastService.success('Assign license completed.');
        },
        _ => {
          this.automatedActivationFailed = true;
        }
      );
  }

  openProfileDialog() {
    this.dialog.open(ProfileDialogComponent, {
      width: '350px',
      data: <ProfileDialogData>{
        domain: this.txtKey
      }
    });
  }

  openPowerShellScriptDialog() {
    this.dialog.open(MsScriptDialogComponent, {
      width: '950px'
    });
  }

  openLinkExtensionDialog(item: DirectRoutingExtension) {
    const dialogRef = this.dialog.open(LinkMsAccountDialogComponent, {
      width: '550px',
      data: <LinkMsAccountDialogData>{
        defaultUser: '',
        defaultKey: item.device.ext ? item.device.ext : item.device.ext
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.getDirectRoutings();
      }
    });
  }

  private addDomain() {
    this.isLoading = true;
    this.msTeamAuthService
      .addDomain(this.txtKey)
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(
        txtValue => {
          this.txtValue = txtValue;
          this.isTryAgain = false;
          this.updateTXTRecordOnRoute53();
        },
        err => {
          this.isTryAgain = true;
          this.errorMessage = err.message ? err.message : err;
        }
      );
  }

  private updateTXTRecordOnRoute53() {
    this.isLoading = true;
    this.msTeamCallCenterService
      .updateTXTRecordOnRoute53(this.txtValue)
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(
        () => {
          this.isWaitingForVerifying = false;
          this.warningMessage =
            'Please ensure that the TXT values have been added to your DNS control panel before clicking on Verify button';
        },
        () => {
          this.errorMessage = 'Something wrong. Please try again later or contact your administrator';
        }
      );
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.filterPredicate = (data: DirectRoutingExtension, filter: string): boolean => {
      return data.device.ext.indexOf(filter) > -1;
    };
  }

  openMassConfigDialog() {
    const dialogRef = this.dialog.open(MassConfigurationDialogComponent, {
      autoFocus: false,
      width: '450px',
      disableClose: true,
      panelClass: 'position-relative'
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.getDirectRoutings();
      }
    });
  }

  openAssignLicenseDialog() {
    this.dialog.open(ActivateLicenseDialogComponent, {
      width: '550px',
      data: <ActivateLicenseDialogData>{
        subscriptions: this.subscriptions,
        domain: this.txtKey
      }
    });
  }

  revoke() {
    this.dialog
      .open(RevokeMsAuthComponent, {
        width: '550px',
        autoFocus: false
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.isLoading = true;
          this.msTeamAuthService
            .revokeAccess(this.clientId)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(
              () => (this.clientId = null),
              () => {
                this.toastService.error(MessageConstants.GENERAL_ERROR);
              }
            );
        }
      });
  }

  confirmUploadNumbersMS() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Provision numbers',
          message: `This action will upload and provision all selected numbers to your Microsoft account.?`,
          cancelLabel: 'Cancel',
          confirmLabel: 'Provision'
        }
      })
      .afterClosed()
      .subscribe(confirm => {
        if (confirm) {
          this.uploadNumbersMS();
        }
      });
  }

  async uploadNumbersMS() {
    this.isUploadingNumber = true;
    let countSuccess = 0;
    for (const operatorConnectNumber of this.checkedNumbers) {
      operatorConnectNumber.status = null;
      operatorConnectNumber.errorMessage = '';
      this.numberLoadding = operatorConnectNumber.number;

      await this.licenseOperatorConnectNumberService
        .uploadNumbersToMicrosoft(operatorConnectNumber.number)
        .toPromise()
        .then(
          _ => {
            countSuccess++;
            operatorConnectNumber.status = 'uploaded';
          },
          error => {
            operatorConnectNumber.status = 'failed';
            operatorConnectNumber.errorMessage = error.message;
          }
        );
      this.numberLoadding = '';
    }
    this.isUploadingNumber = false;
    if (countSuccess === this.checkedNumbers.length) {
      this.getOperatorConnectNumbers();
    }
  }

  selectExtension(ext: DirectRoutingExtension) {
    const idx = this.checkedExtensions.map(n => n.device?.id).indexOf(ext.device?.id);
    if (idx !== -1) {
      this.checkedExtensions.splice(idx, 1);
    } else {
      this.checkedExtensions.push(ext);
    }
  }

  isExtensionChecked(ext: DirectRoutingExtension): boolean {
    return this.checkedExtensions.map(n => n.device?.id).indexOf(ext.device?.id) !== -1;
  }

  selectAllExtensions(event: MatCheckboxChange) {
    this.checkedExtensions = [];
    if (event.checked) {
      this.checkedExtensions = this.directRoutingNotProvision;
    }
    // this.showSelectedNumbers(this.filterForm.value.numberSelected);
  }

  selectNumber(connectNumber: OperatorConnectNumbers) {
    const idx = this.checkedNumbers.map(n => n.number).indexOf(connectNumber.number);
    if (idx !== -1) {
      this.checkedNumbers.splice(idx, 1);
    } else {
      this.checkedNumbers.push(connectNumber);
    }
    this.showSelectedNumbers(this.filterForm.value.numberSelected);
  }

  selectAllNumbers(event: MatCheckboxChange) {
    this.checkedNumbers = [];
    if (event.checked) {
      this.checkedNumbers = this.operatorConnectNumbers;
    }
    this.showSelectedNumbers(this.filterForm.value.numberSelected);
  }

  isNumberChecked(connectNumber: OperatorConnectNumbers): boolean {
    return this.checkedNumbers.map(n => n.number).indexOf(connectNumber.number) !== -1;
  }

  pageChanged(pageEvent: PageEvent) {
    this.pageable.page = pageEvent.pageIndex;
    this.pageable.perPage = pageEvent.pageSize;
    this.getOperatorConnectNumbers();
  }

  pageDRChanged(pageEvent: PageEvent) {
    this.pageableDirectRouting.page = pageEvent.pageIndex;
    this.pageableDirectRouting.perPage = pageEvent.pageSize;
    this.getDirectRoutings();
  }

  showSelectedNumbers(numberSelected) {
    if (numberSelected) {
      this.dataSourceNumbers = new MatTableDataSource<OperatorConnectNumbers>(this.checkedNumbers);
    } else {
      this.dataSourceNumbers = new MatTableDataSource<OperatorConnectNumbers>(this.operatorConnectNumbers);
    }
  }

  checkNumberUploading(number) {
    return this.checkedNumbers.map(n => n.number).indexOf(number) > -1;
  }

  checkDeviceUploading(extKey) {
    return this.checkedExtensions.map(n => n.device.ext).indexOf(extKey) > -1;
  }

  confirmProvisionDevice() {
    this.dialog
      .open(CheckProvisionComponent, { width: '500px' })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.provisionDevice();
        }
      });
  }

  provisionDevice() {
    this.isProvisioningDevices = true;

    const body = this.checkedExtensions.map(ext => {
      return { sipUsername: ext.device.sipAccount.username };
    });

    this.licenseDirectRoutingService
      .provisionToAnyNode(body)
      .pipe(finalize(() => (this.isProvisioningDevices = false)))
      .subscribe(
        result => {
          this.toastService.success('Provisioned successfully');
          this.getDirectRoutings();
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  filterDirectRouting(event: MatCheckboxChange) {
    if (event.checked) {
      this.dataSource = new MatTableDataSource<DirectRoutingExtension>(this.directRoutingNotProvision);
    } else {
      this.dataSource = new MatTableDataSource<DirectRoutingExtension>(this.directRoutingExtensions);
    }
  }
}
