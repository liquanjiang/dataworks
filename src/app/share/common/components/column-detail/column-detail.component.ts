import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import Util from '../../../common/util';
import { ApiService } from '../../../api.service';

@Component({
    selector: 'app-column-detail',
    templateUrl: './column-detail.component.html',
    styleUrls: ['./column-detail.component.css']
})
export class ColumnDetailComponent implements OnInit {
    @Input() moduleName;
    @Input() deteailsInfo;
    @Input() treeNode;
    @Input() ColumnData;
    @Input() ColumnParent;
    @Input() crumbsName;
    @Output() back: EventEmitter<any> = new EventEmitter<any>();
    @Output() backtoChange: EventEmitter<any> = new EventEmitter<any>();
    ColumnDetailData = {
        meta_name: '',
        meta_type: '',
        ts: '',
        namespace: '',
        sql: '',
        dataType: '',
        nullable: null,
        meta_comment: null
    };
    typeArr = Util.typeArr;
    PathArr = [];  // 存放路径字符串组成的数组


    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.ColumnDetailData = this.ColumnData;
        this.getPathArr(this.ColumnData.namespace);
    }

    // 返回查询详情列表页
    backToMetaDetails(toRoot) {
        this.back.emit(toRoot);
    }

    // 通过value获取key
    getkeyByvalue(value, arr) {
        const len = arr.length;
        if (!value || !arr || arr.length === 0) {
            return null;
        }
        for (let i = 0; i < len; i++) {
            if (value === arr[i].code) {
                return arr[i].name;
            }
        }
        return null;
    }

    // 将路径分割成数组并分别展示
    getPathArr(str) {
        this.PathArr = Util.getArrByStr(str, '/');
    }

    // 返回上一层
    backToPre() {
        this.back.emit('back');
    }

    //
    backToChange() {
        this.backtoChange.emit('change');
    }
}
