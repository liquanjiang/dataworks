import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-scan-logs',
    templateUrl: './scan-logs.component.html',
    styleUrls: ['./scan-logs.component.css']
})
export class ScanLogsComponent implements OnInit {
    @Input() logInfoObj;
    @Input() logInfoStyle;
    @Input() logsName;

    constructor() {
    }

    ngOnInit() {
        if (!this.logsName) {
            this.logsName = '执行状态';
        }
    }

}
