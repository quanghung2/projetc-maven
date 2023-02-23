/* eslint-disable prefer-spread */
import { Injectable } from '@angular/core';
import { BlockRef, CallFlow, NodeEntry, Tree } from '@b3networks/api/ivr';
import * as _ from 'lodash';
import { TreeService } from './tree.service';

@Injectable({ providedIn: 'root' })
export class FlowLoaderQcService {
  constructor(private treeService: TreeService) {}

  markLevel(tree: Tree): void {
    const root: NodeEntry = this.treeService.getRoot(tree);
    if (root !== undefined) {
      let currentLevel = 1;
      let processingNode: NodeEntry[] = [];

      root.level = currentLevel;
      processingNode.push(root);

      while (processingNode.length > 0) {
        currentLevel++;

        const nodes: NodeEntry[] = this.treeService.getMultipleDirectChildren(processingNode, tree);
        processingNode = [];
        for (const node of nodes) {
          node.level = currentLevel;
          processingNode.push(node);
        }
      }
    }
  }

  clearFlow(flow: CallFlow) {
    try {
      const cookieKey = this.storageKey(flow);

      this.saveToStorage(cookieKey, JSON.stringify([]));
    } catch (e) {}
  }

  saveFlowInCookie(nodes: NodeEntry[], flow: any): void {
    if (nodes.length === 0) {
      return;
    }

    try {
      const cookieKey = this.storageKey(flow);

      const ids = _.map(nodes, (item: NodeEntry) => {
        return item.uuid.substring(item.uuid.lastIndexOf('_') + 1);
      });

      this.saveToStorage(cookieKey, JSON.stringify(ids));
    } catch (e) {}
  }

  loadFlowFromCookie(tree: Tree, flow: any, defaultLevel: number): NodeEntry[] {
    let ids: string[];
    let cookieKey = '';

    try {
      cookieKey = this.storageKey(flow);

      ids = JSON.parse(this.getFromStorage(cookieKey));
    } catch (e) {
      ids = [];
    }

    if (!ids || ids.length === 0) {
      // load flow with level
      return this.treeService.getNodesWithLevel(defaultLevel, tree);
    } else {
      // get flow in cookie
      const result: NodeEntry[] = _.filter(tree.nodes, (item: NodeEntry) => {
        const matchedId = _.find(ids, id => {
          return this.isMatched(cookieKey, id, flow, item.uuid);
        });
        return matchedId !== null && matchedId !== undefined;
      });

      if (result.length === 0) {
        return this.treeService.getNodesWithLevel(defaultLevel, tree);
      }

      try {
        return this.syncFlowBetweenBrowsers(result, tree);
      } catch (e) {
        return this.treeService.getNodesWithLevel(defaultLevel, tree);
      }
    }
  }

  addBlocks(newTree: Tree, currentNodes: NodeEntry[], newParentNode: NodeEntry, addedNodes: NodeEntry[]): NodeEntry[] {
    if (!addedNodes || !addedNodes.length) {
      return currentNodes;
    }

    if (newParentNode) {
      addedNodes = this.treeService.getDirectChildren(newParentNode, newTree); // ignore addedNodes params if not add the first block
    }

    const holderCurrentNodes = _.filter(currentNodes, (item: NodeEntry) => {
      // remove added nodes in current node list
      const node = _.find(addedNodes, (childItem: NodeEntry) => {
        return childItem.uuid === item.uuid;
      });
      return !node;
    });

    holderCurrentNodes.push.apply(holderCurrentNodes, addedNodes); // add new nodes into current node list

    return _.filter(newTree.nodes, (item: NodeEntry) => {
      // get up-to-date node data from tree
      const node = _.find(holderCurrentNodes, (childItem: NodeEntry) => {
        return childItem.uuid === item.uuid;
      });

      return node != null;
    });
  }

  removeBlocks(newTree: Tree, currentNodes: NodeEntry[], deletedNodes: NodeEntry[]): NodeEntry[] {
    if (!deletedNodes || !deletedNodes.length) {
      return currentNodes;
    }

    const holderCurrentNodes = _.filter(currentNodes, (item: NodeEntry) => {
      // remove deleted nodes in current node list
      const node = _.find(deletedNodes, (childItem: NodeEntry) => {
        return childItem.uuid === item.uuid;
      });
      return !node;
    });

    return _.filter(newTree.nodes, (item: NodeEntry) => {
      // get up-to-date node data from tree
      const node = _.find(holderCurrentNodes, (childItem: NodeEntry) => {
        return childItem.uuid === item.uuid;
      });

      return node != null;
    });
  }

  loadNextStepsOfBlock(tree: Tree, currentNodes: NodeEntry[], node: NodeEntry): NodeEntry[] {
    const newBlocks: NodeEntry[] = this.treeService.getAllChildren([node], tree);
    currentNodes.push.apply(currentNodes, newBlocks);
    return currentNodes;
  }

  unloadNextStepsOfBlock(currentNodes: NodeEntry[], node: NodeEntry): NodeEntry[] {
    const tree: Tree = new Tree({ nodes: currentNodes });
    const removedBlocks: NodeEntry[] = this.treeService.getAllChildren([node], tree);
    const removedIds: string[] = _.map(removedBlocks, (item: NodeEntry) => {
      return item.uuid;
    });

    currentNodes = _.filter(currentNodes, (item: NodeEntry) => {
      return !removedIds.includes(item.uuid);
    });

    return currentNodes;
  }

  private saveToStorage(key: string, value: string): void {
    if (typeof window.localStorage !== 'undefined') {
      window.localStorage.removeItem(key);
      window.localStorage.setItem(key, value);
    }
  }

  private getFromStorage(key: string): string {
    if (typeof window.localStorage !== 'undefined') {
      return window.localStorage.getItem(key);
    }
    return '';
  }

  private storageKey(flow: CallFlow): string {
    if (!flow) {
      return '';
    }

    return (
      flow.orgUuid.substring(0, flow.orgUuid.indexOf('-')) + '_' + flow.uuid.substring(0, flow.uuid.indexOf('-')) + '_'
    );
  }

  private isMatched(storagedKey: string, storagedBlockUuid: string, flow: CallFlow, blockUuid: string): boolean {
    let isMatched = true;
    const parts = storagedKey.split('_');

    if (flow.orgUuid.startsWith('AA-')) {
      isMatched = isMatched && parts[0] === flow.orgUuid;
    } else {
      isMatched = isMatched && parts[0] === flow.orgUuid.substring(0, flow.orgUuid.indexOf('-'));
    }

    isMatched =
      isMatched &&
      parts[1] === flow.uuid.substring(0, flow.uuid.indexOf('-')) &&
      storagedBlockUuid === blockUuid.substring(blockUuid.lastIndexOf('_') + 1);
    return isMatched;
  }

  private syncFlowBetweenBrowsers(cookiesFlow: NodeEntry[], tree: Tree): NodeEntry[] {
    const root = _.find(cookiesFlow, (item: NodeEntry) => {
      return item.uuid === tree.firstBlockUuid;
    });

    return this.syncFlowItemsBetweenBrowsers(root, cookiesFlow, tree);
  }

  private syncFlowItemsBetweenBrowsers(node: NodeEntry, cookiesFlow: NodeEntry[], tree: Tree): NodeEntry[] {
    let displayChildren: NodeEntry[];
    const result: NodeEntry[] = [];

    if (node.refs.length === 0) {
      return [node];
    }

    if (node.refs.length === 1) {
      displayChildren = _.filter(cookiesFlow, (item: NodeEntry) => {
        const existed = _.find(node.refs, (ref: BlockRef) => {
          return ref.nextBlockUuid === item.uuid;
        });

        return !!existed;
      });

      if (displayChildren.length === 1) {
        result.push(node);
        const items: NodeEntry[] = this.syncFlowItemsBetweenBrowsers(displayChildren[0], cookiesFlow, tree);
        result.push.apply(result, items);
        return result;
      }

      if (displayChildren.length > 1) {
        throw new Error('Unexpected errors');
      }

      return [node];
    }

    displayChildren = _.filter(cookiesFlow, (item: NodeEntry) => {
      const existed = _.find(node.refs, (ref: BlockRef) => {
        return ref.nextBlockUuid === item.uuid;
      });

      return !!existed;
    });

    if (displayChildren.length > 0 && displayChildren.length !== node.refs.length) {
      displayChildren = _.filter(tree.nodes, (item: NodeEntry) => {
        const existed = _.find(node.refs, (ref: BlockRef) => {
          return ref.nextBlockUuid === item.uuid;
        });

        return !!existed;
      });
    }

    result.push(node);
    _.forEach(displayChildren, (item: NodeEntry) => {
      const items: NodeEntry[] = this.syncFlowItemsBetweenBrowsers(item, cookiesFlow, tree);
      result.push.apply(result, items);
    });

    return result;
  }
}
