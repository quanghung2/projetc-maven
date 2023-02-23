import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatRadioChange } from '@angular/material/radio';
import { MatTableDataSource } from '@angular/material/table';
import {
  AwsEdgeServer,
  Cluster,
  ClusterQuery,
  CodecProfile,
  Direction,
  HeaderRelayProfile,
  ManipulationProfile,
  Outparam,
  Peer,
  PeerService,
  PreConfig,
  Profile,
  SecurityProfile,
  TranslationProfile
} from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { finalize, takeUntil } from 'rxjs/operators';

export interface CreateTrunkModalInput {
  isEdit: boolean;
  codecs: CodecProfile[];
  securitys: SecurityProfile[];
  peer: Peer;
  peers: Peer[];
  preConfig: PreConfig;
  translations: TranslationProfile[];
  manipulations: ManipulationProfile[];
  headerRelays: HeaderRelayProfile[];
}

@Component({
  selector: 'b3n-create-trunk-modal',
  templateUrl: './create-trunk-modal.component.html',
  styleUrls: ['./create-trunk-modal.component.scss']
})
export class CreateTrunkModalComponent extends DestroySubscriberComponent implements OnInit {
  displayedColumns = ['node', 'name', 'public_ip', 'private_ip', 'sip_port', 'sips_port'];
  formGroup: UntypedFormGroup;
  isLoading: boolean;
  isLoadingDetailInterface: boolean;
  createTrunkModalInput: CreateTrunkModalInput;
  preConfig: PreConfig;

  nodesDataSource: string[] = [];
  awsEdgeServers: AwsEdgeServer[] = [];
  detailInterfaces = new MatTableDataSource<AwsEdgeServer>();
  awsEdgesOutside: AwsEdgeServer[] = [];

  peer: Peer;
  curCluster: Cluster;

  dinsTranslations: string[];
  clidTranslations: string[];
  manipulations: string[];
  dnisSelected: string[] = [];
  clidSelected: string[] = [];
  manipulationSelected: string[] = [];
  hastranslation = false;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  readonly patternMedia =
    '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)((\\/([1-9]|[1-2][0-9]|[1-3][0-2]))|$)$';
  readonly patternSignalling =
    '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$';

  readonly protocols: KeyValue<string, string>[] = [
    { key: 'tcp', value: 'TCP' },
    { key: 'udp', value: 'UDP' },
    { key: 'tls', value: 'TLS' }
  ];

  get name() {
    return this.formGroup.get('name');
  }

  get direction() {
    return this.formGroup.get('direction');
  }

  get signallings(): UntypedFormArray {
    return this.formGroup.get('signallings') as UntypedFormArray;
  }

  get interface() {
    return this.formGroup.get('interface');
  }

  get medias(): UntypedFormArray {
    return this.formGroup.get('medias') as UntypedFormArray;
  }

  get nodes() {
    return this.formGroup.get('nodes');
  }

  get codec() {
    return this.formGroup.get('codec');
  }

  get headerRelay() {
    return this.formGroup.get('headerRelay');
  }

  get dtmfInband() {
    return this.formGroup.get('dtmfInband');
  }

  get security() {
    return this.formGroup.get('security');
  }

  get enable() {
    return this.formGroup.get('enable');
  }
  get username() {
    return this.formGroup.get('username');
  }
  get password() {
    return this.formGroup.get('password');
  }
  get ping() {
    return this.formGroup.get('ping');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: CreateTrunkModalInput,
    private fb: UntypedFormBuilder,
    private peerService: PeerService,
    private clusterQuery: ClusterQuery,
    private dialogRef: MatDialogRef<CreateTrunkModalComponent>
  ) {
    super();
    this.createTrunkModalInput = this.data;
    const translations = this.data.translations.map(item => item.name);
    this.dinsTranslations = [...translations];
    this.clidTranslations = [...translations];
    this.manipulations = [...this.data.manipulations.map(item => item.name)];

    this.preConfig = this.data?.preConfig || new PreConfig();
    if (this.preConfig?.cluster) {
      let awsEdges = [];
      Object.keys(this.preConfig.cluster).forEach(key => {
        this.nodesDataSource.push(key);
        awsEdges = [
          ...awsEdges,
          ...this.preConfig.cluster[key].map(x => {
            x.node = key;
            return x;
          })
        ];
      });

      this.awsEdgesOutside = awsEdges;
      this.awsEdgeServers = this.getUniqueListBy(this.awsEdgesOutside, 'name');
    }
    this.initFormData();
  }

  ngOnInit(): void {
    this.clusterQuery
      .selectActive()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(server => {
        this.curCluster = server;
        this.initPeerDetail();
      });

    this.nodes.valueChanges.subscribe(node => {
      let detailInterfaces = [];
      if (node.length) {
        node?.forEach(item => {
          detailInterfaces = [
            ...detailInterfaces,
            ...this.preConfig.cluster[item].map(x => {
              x.node = item;
              return x;
            })
          ];
        });

        this.updateDetailInterface(detailInterfaces);
        if (!this.createTrunkModalInput.isEdit) {
          this.awsEdgeServers = this.getUniqueListBy(detailInterfaces, 'name');
          this.interface.enable();
        }
      } else {
        if (!this.createTrunkModalInput.isEdit) {
          this.awsEdgeServers = [];
        }
        this.updateDetailInterface([]);
        this.interface.disable();
      }
    });
  }

  initPeerDetail() {
    const { peer } = this.createTrunkModalInput;
    if (this.createTrunkModalInput.isEdit) {
      this.isLoadingDetailInterface = true;
      this.peerService
        .getDetailPeer(peer.name, this.curCluster.cluster)
        .pipe(finalize(() => (this.isLoadingDetailInterface = false)))
        .subscribe(res => {
          this.peer = res;
          const detailInterfaces = this.awsEdgesOutside.filter(item => this.peer.nodes.indexOf(item.node) > -1) || [];
          this.updateDetailInterface(detailInterfaces);

          this.clidSelected = this.peer?.profile?.clidtrs || [];
          this.dnisSelected = this.peer?.profile?.dnistrs || [];
          this.manipulationSelected = this.peer?.profile?.manipulationrs || [];
          this.initTranslationDnisData();
          this.initTranslationClidData();

          const medias = [];
          this.peer?.medias.forEach(item => {
            medias.push({ media: item });
          });
          this.formGroup.patchValue({
            name: this.peer?.name,
            interface: this.peer?.interface,
            direction: this.peer?.direction,
            enable: this.peer?.enable,
            nodes: this.peer?.nodes,
            username: this.peer?.outparam?.username,
            password: this.peer?.outparam?.password,
            ping: this.peer?.outparam?.ping,
            medias: medias,
            codec: this.peer?.profile?.codec,
            security: this.peer?.profile?.security,
            signallings: this.peer?.signallings,
            headerRelay: this.peer?.profile?.relay,
            dtmfInband: this.peer?.dtmf_inband
          });
          if (this.peer?.medias?.length) {
            this.medias.removeAt(0);
            this.peer?.medias.forEach(media => {
              const controls = new UntypedFormGroup({
                media: new UntypedFormControl(media, [Validators.required, Validators.pattern(this.patternMedia)])
              });
              this.medias.push(controls);
            });
          }
          const isInbound = this.peer?.direction?.toLowerCase() === Direction.inbound;
          if (this.peer?.signallings?.length) {
            this.signallings.removeAt(0);
            this.peer?.signallings?.forEach(signalling => {
              const controls = this.fb.group({
                ip: [signalling?.ip, [Validators.required, Validators.pattern(this.patternSignalling)]],
                port: [
                  { value: signalling?.port, disabled: isInbound },
                  [Validators.required, Validators.min(0), Validators.max(65536)]
                ],
                transport: [{ value: signalling?.transport, disabled: isInbound }, Validators.required]
              });
              this.signallings.push(controls);
            });
          }
        });
    } else {
      this.updateDetailInterface([...this.awsEdgesOutside]);
    }
  }

  onSave() {
    if (this.formGroup.invalid && !this.hastranslation) {
      return;
    }

    const medias = this.medias.value.map(item => item.media) || [];
    const request: Peer = {
      name: this.name.value,
      medias: medias,
      profile: new Profile({
        clidtrs: this.clidSelected,
        dnistrs: this.dnisSelected,
        codec: this.codec.value,
        security: this.security.value,
        manipulationrs: this.manipulationSelected,
        relay: this.headerRelay.value
      }),
      nodes: this.nodes.value,
      enable: this.enable.value,
      signallings: this.signallings.value,
      direction: this.direction.value,
      interface: this.interface.value,
      dtmf_inband: this.dtmfInband.value
    };

    if (this.direction.value === Direction.outbound) {
      const outparam: Outparam = {};
      if (this.username.value) {
        outparam.username = this.username.value;
      }
      if (this.password.value) {
        outparam.password = this.password.value;
      }
      if (this.ping.value) {
        outparam.ping = this.ping.value;
      }
      request.outparam = outparam;
    }

    this.isLoading = true;
    if (this.createTrunkModalInput.isEdit) {
      this.updatePeer(request);
      return;
    }

    this.createPeer(request);
  }

  createPeer(request: Peer) {
    this.peerService
      .createPeer(request, this.curCluster.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.dialogRef.close({ success: true });
        },
        err => {
          this.dialogRef.close({ success: false, error: err });
        }
      );
  }

  updatePeer(request: Peer) {
    this.peerService
      .updatePeer(request, this.curCluster.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.dialogRef.close({ success: true });
        },
        err => {
          this.dialogRef.close({ success: false, error: err });
        }
      );
  }

  onChangeDirection(event: MatRadioChange) {
    this.signallings.controls.forEach(item => {
      if (event.value.toString()?.toLowerCase() === Direction.inbound) {
        item.get('port').disable();
        item.get('transport').disable();
      } else {
        item.get('port').enable();
        item.get('transport').enable();
      }
    });
  }

  removeMedia(index: number) {
    this.medias.removeAt(index);
  }

  addMedia() {
    const controls = new UntypedFormGroup({
      media: new UntypedFormControl('', [Validators.required, Validators.pattern(this.patternMedia)])
    });
    this.medias.push(controls);
  }

  removeSignalling(index: number) {
    this.signallings.removeAt(index);
  }

  addSignalling() {
    const isInbound = this.direction.value?.toString()?.toLowerCase() === Direction.inbound;
    const controls = new UntypedFormGroup({
      ip: new UntypedFormControl('', [Validators.required, Validators.pattern(this.patternSignalling)]),
      port: new UntypedFormControl({ value: '', disabled: isInbound }, [
        Validators.required,
        Validators.min(0),
        Validators.max(65536)
      ]),
      transport: new UntypedFormControl({ value: this.protocols[0].key, disabled: isInbound }, Validators.required)
    });
    this.signallings.push(controls);
  }

  drop(event: CdkDragDrop<string[]>, check: boolean) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else if (check) {
      if (event.container.data.length < this.preConfig.limitation.max_peer_rule_size) {
        transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        this.hastranslation = true;
      }
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.hastranslation = true;
    }
  }

  private initFormData() {
    if (this.createTrunkModalInput.isEdit) {
      this.formGroup = this.fb.group({
        name: [
          { value: this.peer?.name, disabled: true },
          [
            Validators.required,
            Validators.pattern(this.preConfig?.pattern?.name),
            this.checkExistsPeerValidator.bind(this)
          ]
        ],
        username: [{ value: this.peer?.outparam?.username }],
        password: [{ value: this.peer?.outparam?.password }],
        ping: [{ value: this.peer?.outparam?.ping }, [Validators.min(30), Validators.max(3600)]],
        interface: [{ value: this.peer?.interface, disabled: true }, Validators.required],
        direction: [{ value: this.peer?.direction, disabled: true }, Validators.required],
        enable: [this.peer?.enable],
        security: [this.peer?.profile?.security, Validators.required],
        codec: [this.peer?.profile?.codec, Validators.required],
        headerRelay: [this.peer?.profile?.relay],
        dtmfInband: [this.peer?.dtmf_inband],
        nodes: [this.peer?.nodes, Validators.required],
        medias: this.fb.array([
          this.fb.group({
            media: ['', [Validators.required, Validators.pattern(this.patternMedia)]]
          })
        ]),
        signallings: this.fb.array([
          this.fb.group({
            ip: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(this.patternSignalling)]],
            port: [{ value: '', disabled: true }, [Validators.required, Validators.min(0), Validators.max(65536)]],
            transport: [{ value: this.protocols[0].key, disabled: true }, Validators.required]
          })
        ])
      });

      return;
    }

    this.formGroup = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(this.preConfig?.pattern?.name),
          this.checkExistsPeerValidator.bind(this)
        ]
      ],
      username: [''],
      password: [''],
      ping: [null],
      interface: [this.awsEdgeServers?.length ? this.awsEdgeServers[0].name : '', Validators.required],
      direction: [this.preConfig?.directions[0], Validators.required],
      enable: [true],
      security: [this.data?.securitys?.length ? this.data.securitys[0].name : '', Validators.required],
      codec: [this.data?.codecs?.length ? this.data.codecs[0].name : '', Validators.required],
      headerRelay: [''],
      dtmfInband: [false],
      nodes: [this.nodesDataSource, Validators.required],
      medias: this.fb.array([
        this.fb.group({
          media: ['', [Validators.required, Validators.pattern(this.patternMedia)]]
        })
      ]),
      signallings: this.fb.array([
        this.fb.group({
          ip: ['', [Validators.required, Validators.pattern(this.patternSignalling)]],
          port: [
            { value: '', disabled: this.preConfig?.directions[0] === Direction.inbound },
            [Validators.required, Validators.min(0), Validators.max(65536)]
          ],
          transport: [
            { value: this.protocols[0].key, disabled: this.preConfig?.directions[0] === Direction.inbound },
            Validators.required
          ]
        })
      ])
    });
  }

  private initTranslationDnisData() {
    if (this.dinsTranslations.length) {
      const translationOrigin = [...this.dinsTranslations];
      translationOrigin.forEach(element => {
        if (this.dnisSelected.indexOf(element) > -1) {
          this.dinsTranslations.splice(this.dinsTranslations.indexOf(element), 1);
        }
      });
    }
  }

  private initTranslationClidData() {
    if (this.clidTranslations.length) {
      const translationOrigin = [...this.clidTranslations];
      translationOrigin.forEach(element => {
        if (this.clidSelected.indexOf(element) > -1) {
          this.clidTranslations.splice(this.clidTranslations.indexOf(element), 1);
        }
      });
    }
  }

  private checkExistsPeerValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const { peers } = this.createTrunkModalInput;

    let namesCodec = [];
    if (peers?.length) {
      namesCodec = peers.map(peer => peer.name);
    }

    if (namesCodec.indexOf(control.value?.toString()) > -1) {
      return { isExistsPeer: true };
    }
    return null;
  }

  private getUniqueListBy(arr: AwsEdgeServer[], key): AwsEdgeServer[] {
    return [...new Map(arr.map(item => [item[key], item])).values()];
  }

  private updateDetailInterface(data: AwsEdgeServer[]) {
    this.detailInterfaces = new MatTableDataSource<AwsEdgeServer>(data);
    this.detailInterfaces.paginator = this.paginator;
  }
}
