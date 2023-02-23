import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output } from '@angular/core';
// import 'tinymce';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/hr';
import 'tinymce/plugins/image';
import 'tinymce/plugins/imagetools';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/paste';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/table';
import 'tinymce/plugins/template';
import 'tinymce/plugins/textcolor';
import 'tinymce/plugins/textpattern';
import 'tinymce/plugins/wordcount';

declare var tinymce: any;
declare var jQuery: any;

@Directive({
  selector: '[tinymce]',
  exportAs: 'tinymce'
})
export class TinymceDirective implements AfterViewInit, OnDestroy {
  /**
   * NOT to set editor content here, it will force editor to reset cursor to the start index.
   * Call method setContent() manually if want to change editor content
   **/
  @Input('value') set _value(val) {
    this.inputValue = val;
    // this.setContent(val);
  }
  @Input() options: any;
  @Input('showIf') set _showIf(showIf: boolean) {
    this.showIf = showIf;
    if (showIf) {
      this.initialize();
    } else {
      this.ngOnDestroy();
    }
  }

  @Output() focused = new EventEmitter<any>();
  @Output() blurred = new EventEmitter<any>();
  @Output() changed = new EventEmitter<any>();
  @Output() onDirty = new EventEmitter<any>();

  showIf = true;
  editorRefs = new Array<any>();
  editor: any;
  inputValue: any;

  constructor(private el: ElementRef, private zone: NgZone) {}

  ngAfterViewInit() {
    if (this.showIf) {
      this.initialize();
    }
  }

  ngOnDestroy() {
    this.destroyEditor();
  }

  initialize() {
    // this.destroyEditor();
    let href = window.location.origin + jQuery('base').attr('href');
    if (!this.options) {
      this.options = {
        target: this.el.nativeElement,
        skin_url: href + 'assets/tinymce/skins/ui/oxide',
        inline: false,
        statusbar: true,
        browser_spellcheck: true,
        contextmenu: false,
        height: 400,
        resize: true,
        branding: false,
        plugins: `searchreplace autolink image link template table hr advlist lists wordcount imagetools textpattern paste`,
        toolbar: `undo redo | styleselect | fontsizeselect bold italic underline | bullist numlist | removeformat`,
        paste_webkit_styles: 'color font-size font-weight text-align',
        paste_retain_style_properties: 'color font-size font-weight text-align',
        paste_merge_formats: true,
        fontsize_formats: '10px 12px 13px 14px 15px 16px 17px 18px 20px 24px 26px 28px 36px 48px',
        // menu: {
        //   edit: { title: 'Edit', items: 'undo redo | cut copy paste | selectall' },
        //   insert: { title: 'Insert', items: 'image link inserttable | hr' },
        //   format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats blockformats align fonts fontsizes | removeformat' }
        // },
        // menubar: 'edit insert format',
        menubar: false,
        image_advtab: true,
        content_css: [href + 'assets/tinymce/override.css'],
        content_style: 'body{font-size: 14px!important;}',
        importcss_append: true,
        image_caption: true,
        setup: editor => (this.editor = editor),
        init_instance_callback: editor => {
          editor.on('focus', () => this.focused.emit(editor.getContent()));
          editor.on('blur', () => this.blurred.emit(editor.getContent()));
          editor.on('Change', () => this.changed.emit(editor.getContent()));
          editor.on('Keyup', () => this.changed.emit(editor.getContent()));
          editor.on('Dirty', () => this.onDirty.emit(editor.getContent()));
        }
      };
    }

    tinymce.init(this.options).then(editors => {
      if (editors instanceof Array) {
        this.editorRefs = editors;
      } else {
        this.editorRefs.push(editors);
      }

      this.setContent(this.inputValue);
    });
  }

  setContent(val) {
    for (let e of this.editorRefs) {
      e.setContent(val || '');
    }
  }

  insertContent(val) {
    for (let e of this.editorRefs) {
      e.execCommand('mceInsertContent', false, val);
    }
  }

  destroyEditor() {
    for (let e of this.editorRefs) {
      tinymce.remove(e);
    }
  }
}
