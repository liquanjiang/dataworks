import { Component, OnInit, AfterViewInit, ElementRef, Input, Output, EventEmitter } from '@angular/core';
declare var CodeMirror: any;
@Component({
  selector: 'app-code-area',
  templateUrl: './code-area.component.html',
  styleUrls: ['./code-area.component.css']
})
export class CodeAreaComponent implements OnInit, AfterViewInit {

    /**
     * 需要展示的sql
     */
    @Input() sqlValue;

    /**
     * sql 输入值变化时，触发此事件
     * @type {EventEmitter<any>}
     */
    @Output() sqlValueChange: EventEmitter<any> = new EventEmitter<any>();

    /**
     * codeMirror对象
     */
    sqlEditor;
    hasInit = false;
    constructor(private elementRef: ElementRef) { }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.hasInit = true;
        const myTextarea = this.elementRef.nativeElement.querySelector('textarea');
        this.sqlEditor = CodeMirror.fromTextArea(myTextarea, {
            lineNumbers: true,
            value: null,
            mode: 'text/x-sql'
        });
        if (this.sqlValue) {
            this.sqlEditor.setValue(this.sqlValue);
        }
        this.sqlEditor.on('change', (doc) => {
            this.sqlValueChange.emit(doc.getValue());
        });
    }

}
