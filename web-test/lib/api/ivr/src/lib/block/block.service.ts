import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CallFlow } from '../flow/callflow.service';
import { Tree } from '../flow/tree';
import { Block, BlockType } from './block';
import { BlockRef } from './branch/block-ref';
import { ConditionBranch } from './branch/condition-branch';
import { GatherBranch } from './branch/gather-branch';
import { WebhookBranch } from './branch/webhook-branch';
import { ConditionBlock } from './condition-block';
import { ConfirmBlock } from './confirm-block';
import { GatherBlock } from './gather-block';
import { GoBlock } from './go-block';
import { NodeEntry } from './node-entry';
import { NotifyBlock } from './notify-block';
import { PlayBlock } from './play-block';
import { TransferBlock } from './transfer-block';
import { WebhookBlock } from './webhook-block';

@Injectable({
  providedIn: 'root'
})
export class BlockService {
  constructor(protected http: HttpClient) {}

  /*** SERVER METHODS ***/
  generateBlockUuid(nodes: NodeEntry[]): number {
    let currentMaxId = 0;
    _.forEach(nodes, (node: NodeEntry) => {
      const startIndex = node.uuid.lastIndexOf('_') + 1;
      const id: number = Number(node.uuid.substring(startIndex));
      if (id > currentMaxId) {
        currentMaxId = id;
      }
    });

    return currentMaxId;
  }

  saveBlock(
    flow: CallFlow,
    parent: Block,
    currents: Block[],
    workFlowUuid: string,
    version: number
  ): Observable<GeneralBlockResponse> {
    const body: any = {
      parentBlock: parent,
      currentBlocks: currents,
      updatedAt: flow.updatedAt,
      workFlowUuid: workFlowUuid,
      version: version
    };
    return this.http
      .post<GeneralBlockResponse>(`workflow/private/v1/ivrFlows/${flow.uuid}/blocks`, body, {})
      .pipe(map(res => new GeneralBlockResponse(res)));
  }

  deleteBlock(
    flow: CallFlow,
    parentUuid: string,
    deletingUuid: string,
    mode: string,
    workFlowUuid: string,
    version: number
  ): Observable<GeneralBlockResponse> {
    const body: any = {
      parentUuid: parentUuid,
      deletingUuid: deletingUuid,
      mode: mode,
      updatedAt: flow.updatedAt,
      workFlowUuid: workFlowUuid,
      version: version
    };

    return this.http
      .post<GeneralBlockResponse>(`workflow/private/v1/ivrFlows/${flow.uuid}/blocks/_delete`, body, {})
      .pipe(map(res => new GeneralBlockResponse(res)));
  }

  checkDependencies(ivrFlowUuid: string, blockUuid: string): Observable<{ [key: string]: string[] }> {
    return this.http.get<{ [key: string]: string[] }>(
      `workflow/private/v1/ivrFlows/${ivrFlowUuid}/blocks/${blockUuid}/checkDependence`
    );
  }

  getBlock(flow: CallFlow, blockUuid: string): Observable<Block> {
    return this.http.get<Block>(`workflow/private/v1/ivrFlows/${flow.uuid}/blocks/${blockUuid}`).pipe(
      map(res => {
        switch (res.type) {
          case BlockType.condition:
            return new ConditionBlock(res);
          case BlockType.confirmation:
            return new ConfirmBlock(res);
          case BlockType.gather:
            return new GatherBlock(res);
          case BlockType.go:
            return new GoBlock(res);
          case BlockType.notification:
            return new NotifyBlock(res);
          case BlockType.play:
            return new PlayBlock(res);
          case BlockType.transfer:
            return new TransferBlock(res);
          case BlockType.webhook:
            return new WebhookBlock(res);
          default:
            return new Block(res);
        }
      })
    );
  }

  /*** PARENT BLOCK METHODS ***/
  addBranch(nextBlockUuid: string, block: Block): BlockRef {
    if (block) {
      this.removeBranch(nextBlockUuid, block);

      let ref: BlockRef;
      if (block.type == BlockType.condition) {
        ref = new ConditionBranch({ nextBlockUuid: nextBlockUuid });
      } else if (block.type == BlockType.gather) {
        ref = new GatherBranch({ nextBlockUuid: nextBlockUuid });
      } else if (block.type == BlockType.webhook) {
        ref = new WebhookBranch({ nextBlockUuid: nextBlockUuid });
      } else {
        ref = new BlockRef({ nextBlockUuid: nextBlockUuid });
      }

      block.nextBlocks.push(ref);

      return ref;
    }

    return undefined;
  }

  getBranch(nextBlockUuid: string, block: Block): BlockRef {
    return _.find(block.nextBlocks, (item: BlockRef) => {
      return item.nextBlockUuid == nextBlockUuid;
    });
  }

  removeBranch(nextBlockUuid: string, block: Block) {
    if (block) {
      block.nextBlocks = _.filter(block.nextBlocks, (item: BlockRef) => {
        return item.nextBlockUuid != nextBlockUuid;
      });
    }
  }

  updateBranch(oldNextBlockUuid: string, newNextBlockUuid, block: Block): BlockRef {
    let ref: BlockRef;
    if (block) {
      _.forEach(block.nextBlocks, (item: BlockRef) => {
        if (item.nextBlockUuid == oldNextBlockUuid) {
          item.nextBlockUuid = newNextBlockUuid;
          ref = item;
        }
      });
    }
    return ref;
  }

  updateNextBlockMap(block: Block) {
    block.nextBlockMap = _.keyBy(block.nextBlocks, (item: BlockRef) => {
      return item.nextBlockUuid;
    });
  }
}

export class GeneralBlockResponse {
  status: string;
  flow: CallFlow;
  tree: Tree;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  get isSuccess() {
    return this.status === 'ok';
  }

  get isOutdatedFlow() {
    return this.status === 'ivr.flowIsOutdated';
  }
}
