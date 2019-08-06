import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import Util from '../../../common/util';
import * as _ from 'lodash';

@Component({
    selector: 'app-search-single-select',
    templateUrl: './search-single-select.component.html',
    styleUrls: ['./search-single-select.component.css']
})
export class SearchSingleSelectComponent implements OnInit {
    @Input() setWidth;
    @Input() FixedName;
    @Input() FilterArr;
    @Input() selectedItem;
    @Input() ItemsArr;
    @Output() newSelectItem: EventEmitter<any> = new EventEmitter<any>();
    listArr = [];
    searchKey; // 存放搜索关键字


    constructor() {
    }

    ngOnInit() {
        this.listArr = _.cloneDeep(this.ItemsArr);
    }

    // 根据关键字进行搜索
    searchList(searchKey) {
        this.listArr = _.cloneDeep(this.ItemsArr);
        const list = this.listArr;
        const key = searchKey;
        if (key) {
            this.listArr = list.filter((item) => {
                if (this.setWidth) {
                    return item.name.includes(key) || item.namespace.includes(key);
                } else {
                    return item.name.includes(key);
                }
            });
        } else {
            this.listArr = _.cloneDeep(this.ItemsArr);
        }

    }

    // 列表的点击选中事件
    ClickItem(item) {
        this.newSelectItem.emit(item);
    }
}
