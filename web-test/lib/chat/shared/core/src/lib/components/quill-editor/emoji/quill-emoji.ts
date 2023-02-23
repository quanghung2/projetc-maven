import { DOWN_ARROW, ESCAPE, LEFT_ARROW, RIGHT_ARROW, TAB, UP_ARROW } from '@angular/cdk/keycodes';
import { RegExpPattern } from '../../../core/constant/patterns.const';
import EmojiMap, { EmojiItem } from './emoji-map';

declare let Quill: any;
declare let jQuery: any;

export class QuillEmoji {
  isOpen: boolean;
  itemIndex: number;
  emojiCharPos: any;
  cursorPos: any;
  values: any[];
  quill: any;
  options: any;
  emojiContainer: any;
  matchingSpan: any;
  emojiList: any;

  emojiMatrix: any[] = [];

  constructor(quill, options) {
    this.isOpen = false;
    this.itemIndex = 0;
    this.emojiCharPos = null;
    this.cursorPos = null;
    this.values = [];

    this.quill = quill;

    this.options = {
      source: null,
      renderItem(item) {
        return `${item.value}`;
      },
      emojiDenotationChars: [':'],
      allowedChars: RegExpPattern.ALLOWED_CHARS,
      minChars: 1,
      maxChars: 31,
      offsetTop: 2,
      offsetLeft: 0,
      id: '__emoji_container_id__'
    };

    Object.assign(this.options, options);
    this.buildEmojiContainer();

    quill.on('text-change', this.onTextChange.bind(this));
    quill.on('selection-change', this.onSelectionChange.bind(this));

    quill.keyboard.addBinding(
      {
        key: TAB
      },
      this.selectHandler.bind(this)
    );
    quill.keyboard.bindings[TAB].unshift(quill.keyboard.bindings[TAB].pop());

    quill.keyboard.addBinding(
      {
        key: ESCAPE
      },
      this.escapeHandler.bind(this)
    );

    quill.keyboard.addBinding(
      {
        key: UP_ARROW
      },
      this.upHandler.bind(this)
    );

    quill.keyboard.addBinding(
      {
        key: DOWN_ARROW
      },
      this.downHandler.bind(this)
    );

    quill.keyboard.addBinding(
      {
        key: LEFT_ARROW
      },
      this.leftHandler.bind(this)
    );

    quill.keyboard.addBinding(
      {
        key: RIGHT_ARROW
      },
      this.nextHandler.bind(this)
    );
  }

  buildEmojiContainer() {
    this.emojiContainer = document.createElement('div');
    this.emojiContainer.className = 'ql-list-container emoji-container';
    this.emojiContainer.style.cssText = 'display: none; position: absolute;';
    this.emojiContainer.id = this.options.id;

    const header = document.createElement('div');
    header.className = 'ql-list-header';

    this.matchingSpan = document.createElement('div');
    this.matchingSpan.className = 'match';

    header.appendChild(this.matchingSpan);
    this.emojiContainer.appendChild(header);

    const hint = document.createElement('div');
    hint.className = 'hint';
    const enter = document.createElement('div');
    enter.className = 'hint-item';
    enter.innerHTML = `<span class="keyword">\u23CE</span> to select`;
    hint.appendChild(enter);

    const esc = document.createElement('div');
    esc.innerHTML = `<span class="keyword">esc</span> to dismiss`;
    hint.appendChild(esc);

    header.appendChild(hint);

    this.emojiList = document.createElement('ul');
    this.emojiList.className = 'ql-list';
    this.emojiList.id = 'ql-emoji-list';
    this.emojiContainer.appendChild(this.emojiList);

    document.body.appendChild(this.emojiContainer);
  }

  selectHandler() {
    if (this.isOpen) {
      this.selectItem();
      return false;
    }
    return true;
  }

  escapeHandler() {
    if (this.isOpen) {
      this.hideEmojiList();
      return false;
    }
    return true;
  }

  leftHandler() {
    if (this.isOpen) {
      this.prevItem();
      return false;
    }

    return true;
  }

  upHandler() {
    if (this.isOpen) {
      if (this.emojiMatrix.length <= 1) {
        this.prevItem();
      } else {
        const cRow = this.emojiMatrix.findIndex(x => x.indexOf(this.itemIndex) >= 0);
        let nextRowIndex = cRow - 1;
        const currentColum = this.emojiMatrix[cRow].indexOf(this.itemIndex);

        if (nextRowIndex < 0) {
          nextRowIndex = this.emojiMatrix.length - 1;
        }
        const nextRow = this.emojiMatrix[nextRowIndex];

        if (nextRow.length <= currentColum) {
          this.itemIndex = nextRow[nextRow.length - 1];
        } else {
          this.itemIndex = nextRow[currentColum];
        }
        this.highlightItem();
      }

      return false;
    }
    return true;
  }

  nextHandler() {
    if (this.isOpen) {
      this.nextItem();
      return false;
    }
    return true;
  }

  downHandler() {
    if (this.isOpen) {
      // this.nextItem();
      if (this.emojiMatrix.length <= 1) {
        this.nextItem();
      } else {
        const cRow = this.emojiMatrix.findIndex(x => x.indexOf(this.itemIndex) >= 0);
        let nextRowIndex = cRow + 1;

        const currentColum = this.emojiMatrix[cRow].indexOf(this.itemIndex);

        if (nextRowIndex >= this.emojiMatrix.length) {
          nextRowIndex = 0;
        }
        const nextRow = this.emojiMatrix[nextRowIndex];

        if (nextRow.length <= currentColum) {
          this.itemIndex = nextRow[nextRow.length - 1];
        } else {
          this.itemIndex = nextRow[currentColum];
        }
        this.highlightItem();
      }

      return false;
    }
    return true;
  }

  showEmojiList() {
    this.emojiContainer.style.visibility = 'hidden';
    this.emojiContainer.style.display = '';
    this.setemojiContainerPosition();
    this.isOpen = true;
  }

  hideEmojiList() {
    this.emojiContainer.style.display = 'none';
    this.isOpen = false;
  }

  highlightItem() {
    for (let i = 0; i < this.emojiList.childNodes.length; i += 1) {
      this.emojiList.childNodes[i].classList.remove('selected');
    }
    this.emojiList.childNodes[this.itemIndex].classList.add('selected');
    const itemHeight = this.emojiList.childNodes[this.itemIndex].offsetHeight;
    this.emojiContainer.scrollTop = this.itemIndex * itemHeight;
  }

  getItemData(): EmojiItem {
    const name = this.emojiList.childNodes[this.itemIndex].dataset.value;
    return EmojiMap.NameToEmoji[name];
  }

  selectItem() {
    const data = this.getItemData();
    this.embed('emoji', data, Quill.sources.API, this.emojiCharPos, this.cursorPos);
    this.hideEmojiList();
  }

  onItemClick(e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    this.itemIndex = e.currentTarget.dataset.index;
    this.highlightItem();
    this.selectItem();
  }

  renderList(emojiChar, data, searchTerm) {
    if (data && data.length > 0) {
      data = data.slice(0, 29);
      this.values = data;
      this.matchingSpan.innerHTML = `Emoji matching <span class="keyword">":${searchTerm}"</span>`;
      this.emojiList.innerHTML = '';

      const lim: number = Math.min(30, data.length);

      for (let i = 0; i < lim; i += 1) {
        const li: HTMLElement = document.createElement('li');
        li.className = 'ql-list-item';
        li.dataset['index'] = i.toString();
        li.dataset['id'] = `emoji${i}`;
        li.id = `emoji-item-${i}`;
        li.dataset['value'] = data[i].name;
        li.dataset['denotationChar'] = emojiChar;

        const emojSpan = `<span class="button-emoji ap ap-${data[i].name}">${data[i].shortname}</span>
        <span class="caption">${data[i].shortname}</span>`;

        li.innerHTML = emojSpan;
        li.onclick = this.onItemClick.bind(this);

        this.emojiList.appendChild(li);
      }
      this.itemIndex = 0;
      this.highlightItem();
      this.showEmojiList();
      setTimeout(_ => {
        this.calculateEmojiMatrix(data);
      }, 300);
    } else {
      this.hideEmojiList();
    }
  }

  nextItem() {
    this.itemIndex = (this.itemIndex + 1) % this.values.length;
    this.highlightItem();
  }

  prevItem() {
    this.itemIndex = (this.itemIndex + this.values.length - 1) % this.values.length;
    this.highlightItem();
  }

  containerBottomIsNotVisible(topPos) {
    return topPos + this.emojiContainer.offsetHeight > window.pageYOffset + window.innerHeight;
  }

  containerRightIsNotVisible(leftPos) {
    const rightPos = leftPos + this.emojiContainer.offsetWidth;
    const browserWidth = window.pageXOffset + document.documentElement.clientWidth;
    return rightPos > browserWidth;
  }

  setemojiContainerPosition() {
    const containerPos = this.quill.container.getBoundingClientRect();
    const emojiCharPos = this.quill.getBounds(this.emojiCharPos);

    let topPos = window.pageYOffset + containerPos.top + emojiCharPos.bottom + this.options.offsetTop;

    let leftPos = window.pageXOffset + containerPos.left + this.options.offsetLeft;

    if (this.containerBottomIsNotVisible(topPos)) {
      const overemojiCharPos = window.pageYOffset + containerPos.top + emojiCharPos.top;
      const containerHeight = this.emojiContainer.offsetHeight + this.options.offsetTop;
      topPos = overemojiCharPos - containerHeight;
    }

    if (this.containerRightIsNotVisible(leftPos)) {
      const containerWidth = this.emojiContainer.offsetWidth + this.options.offsetLeft;
      const browserWidth = window.pageXOffset + document.documentElement.clientWidth;
      leftPos = browserWidth - containerWidth;
    }

    const position: DOMRect = this.quill?.root?.getBoundingClientRect();
    if (position) {
      this.emojiContainer.style.position = 'fixed';
      this.emojiContainer.style.left = `${position.left}px`;
      this.emojiContainer.style.width = `${position.width}px`; // set full quill editor
      this.emojiContainer.style.top = `${position.top - this.emojiContainer.clientHeight - 5}px`;
      this.emojiContainer.style.visibility = 'visible';
    }
  }

  calculateEmojiMatrix(data) {
    this.emojiMatrix = [];
    if (data.length <= 0) {
      return;
    }

    let currentTop = 0;
    let currentRow = 0;

    const renderedEmojis = jQuery('#ql-emoji-list li');

    if (renderedEmojis && renderedEmojis.length > 0) {
      renderedEmojis.each((idx, el) => {
        if (idx === 0) {
          currentTop = el.offsetTop;
          this.emojiMatrix[0] = [0];
        } else if (el.offsetTop >= currentTop - 3 && el.offsetTop <= currentTop + 3) {
          this.emojiMatrix[currentRow].push(idx);
        } else {
          currentTop = el.offsetTop;
          currentRow += 1;
          this.emojiMatrix[currentRow] = [idx];
        }
      });
    }
  }

  onSomethingChange() {
    const range = this.quill.getSelection();
    if (range == null) {
      return;
    }
    this.cursorPos = range.index;
    const startPos = Math.max(0, this.cursorPos - this.options.maxChars);
    const beforeCursorPos = this.quill.getText(startPos, this.cursorPos - startPos);

    const emojiCharIndex = this.options.emojiDenotationChars.reduce((prev, cur) => {
      const previousIndex = prev;
      const emojiIndex = beforeCursorPos.lastIndexOf(cur);

      return emojiIndex > previousIndex ? emojiIndex : previousIndex;
    }, -1);

    if (emojiCharIndex > -1) {
      const emojiCharPos = this.cursorPos - (beforeCursorPos.length - emojiCharIndex);
      this.emojiCharPos = emojiCharPos;

      if (emojiCharIndex > 0) {
        const beforeChar = beforeCursorPos[emojiCharIndex - 1];
        if (beforeChar !== ' ') {
          this.hideEmojiList();
          return;
        }
      }

      const textAfter = beforeCursorPos.substring(emojiCharIndex + 1);
      if (textAfter.length >= this.options.minChars && this.hasValidChars(textAfter)) {
        const emojiChar = beforeCursorPos[emojiCharIndex];
        this.options.source(textAfter, this.renderList.bind(this, emojiChar), emojiChar);
      } else {
        this.hideEmojiList();
      }
    } else {
      this.hideEmojiList();
    }
  }

  hasValidChars(s) {
    return this.options.allowedChars.test(s);
  }

  onTextChange(delta, oldDelta, source) {
    if (source === 'user') {
      this.onSomethingChange();
    }
  }

  onSelectionChange(range) {
    if (range && range.length === 0) {
      this.onSomethingChange();
    } else {
      this.hideEmojiList();
    }
  }

  private embed(embedType: string, embedData: any, sourceAPI: any, detectCharPos: number, cursorPos: number) {
    this.quill.editor.deleteText(detectCharPos, cursorPos - detectCharPos, sourceAPI);
    this.quill.editor.insertEmbed(detectCharPos, embedType, embedData, sourceAPI);
    this.quill.editor.insertText(detectCharPos, '', sourceAPI);
    this.quill.editor.insertText(detectCharPos + 1, ' ', sourceAPI);
    this.quill.setSelection(detectCharPos + 3, sourceAPI);
  }
}
