import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BlockService, CallFlow, Tree } from '@b3networks/api/ivr';
import { finalize } from 'rxjs/operators';
import { ToastService } from '@b3networks/shared/ui/toast';

declare let $: any;

@Component({
  selector: 'b3n-delete-block',
  templateUrl: './delete-block.component.html',
  styleUrls: ['./delete-block.component.scss']
})
export class DeleteBlockComponent implements OnInit {
  public deleteAll: boolean;
  public message: string;

  public leafNode: boolean;
  public multipleBranchNode: boolean;

  private deleteAllMessage = 'Delete current block and all behind it. Are you sure?';
  private deleteSingleMessage = 'This action will delete single block. Are you sure?';
  deleting: boolean;
  fetching: boolean;
  blockDependencies: { [key: string]: string[] };
  forwardBlocks = [];

  constructor(
    public dialogRef: MatDialogRef<DeleteBlockComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteNodeData,
    private blockService: BlockService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.fetching = true;
    this.blockService
      .checkDependencies(this.data.flow.uuid, this.data.deletingUuid)
      .pipe(finalize(() => (this.fetching = false)))
      .subscribe(dependencies => {
        this.blockDependencies = dependencies;
        this.forwardBlocks = Object.values(this.blockDependencies)
          .reduce((acc, val) => acc.concat(val), [])
          .map(uuid => {
            return new Tree(this.data.tree).getBlockLabel(uuid);
          });
        const currentBlockDependencies = this.blockDependencies[this.data.deletingUuid] || [];

        this.message =
          currentBlockDependencies.length === 0
            ? this.deleteSingleMessage
            : `This action can break the workflow forwarded from <strong> ${this.forwardBlocks.join(
                ' and '
              )}</strong>. Are you sure to delete this block?`;

        this.leafNode = this.data.leafNode;
        this.multipleBranchNode = this.data.multipleBranchNode;

        if (this.leafNode || this.multipleBranchNode) {
          this.toggleDeleteAll();
        }
      });
  }

  toggleDeleteAll() {
    this.deleteAll = !this.deleteAll;
    const currentBlockDependencies = this.blockDependencies[this.data.deletingUuid] || [];

    this.message = this.deleteAll
      ? Object.keys(this.blockDependencies).length === 0
        ? this.deleteAllMessage
        : `This action can break the workflow forwarded from <strong> ${this.forwardBlocks.join(
            ' and '
          )} </strong>. Are you sure to delete this block?`
      : currentBlockDependencies.length === 0
      ? this.deleteSingleMessage
      : `This action can break the workflow forwarded from <strong> ${this.forwardBlocks.join(
          ' and '
        )}</strong>. Are you sure to delete this block?`;
  }

  delete() {
    this.deleting = true;
    const mode: string = this.deleteAll ? DeleteMode[DeleteMode.cascade] : DeleteMode[DeleteMode.updateRef];

    this.blockService
      .deleteBlock(
        this.data.flow,
        this.data.parentUuid,
        this.data.deletingUuid,
        mode,
        this.data.workFlowUuid,
        this.data.version
      )
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe(
        result => {
          if (result.isSuccess) {
            this.toastService.success('Deleted successfully!');
            this.dialogRef.close(result);
          } else {
            this.toastService.error('Error while deleting blocks.');
            this.dialogRef.close();
          }
        },
        error => {
          this.toastService.error('Unexpected error while deleting blocks.');
          this.dialogRef.close();
        }
      );
  }
}

export enum DeleteMode {
  cascade,
  updateRef
}

export interface DeleteNodeData {
  flow: CallFlow;
  parentUuid: string;
  deletingUuid: string;
  leafNode: boolean;
  multipleBranchNode: boolean;
  workFlowUuid: string;
  version: number;
  tree: Tree;
}
