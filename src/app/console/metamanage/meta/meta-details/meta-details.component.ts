import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../../share/api.service';
import Util from '../../../../share/common/util';
import * as _ from 'lodash';

@Component({
    selector: 'app-meta-details',
    templateUrl: './meta-details.component.html',
    styleUrls: ['./meta-details.component.css']
})
export class MetaDetailsComponent implements OnInit {
    @Input() queryDetailspk;
    @Input() treeNode;
    @Input() deteailsInfo;
    @Output() back: EventEmitter<any> = new EventEmitter<any>();
    detailsTableColHeaders = ['表名称', '注释', '采集时间'];
    detailsViewColHeaders = ['视图名称', '采集时间'];
    detailsProColHeaders = ['过程名称', '采集时间'];
    detailsColHeaders = this.detailsTableColHeaders;
    detailsColumns = []; // 存放表格里的详细信息
    detailsTableColumns = [  // 存放表类型的数据的详细信息
        {
            data: 'meta_name',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = '';
                const item = instance.getSourceDataAtRow(instance.toPhysicalRow(row));
                const table_info = document.createElement('span');
                table_info.className = 'table-info';
                table_info.title = '查看详情';
                table_info.innerHTML = '' + item.meta_name + '';
                table_info.addEventListener('click', () => {
                    this.showChildDetailsInfo(item);
                });
                td.appendChild(table_info);
                return td;
            }
        },
        {
            data: 'meta_comment'
        },
        {
            data: 'ts'
        }
    ];
    detailsOtherColumns = [
        {
            data: 'meta_name',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = '';
                const item = instance.getSourceDataAtRow(instance.toPhysicalRow(row));
                const table_info = document.createElement('span');
                table_info.className = 'table-info';
                table_info.title = '查看详情';
                table_info.innerHTML = '' + item.meta_name + '';
                table_info.addEventListener('click', () => {
                    this.showChildDetailsInfo(item);
                });
                td.appendChild(table_info);
                return td;
            }
        },
        {
            data: 'ts'
        }
    ];
    deteailsTable = ''; // 存放采集数据详情信息里的表项数组
    TabList = 0; // 存放当前tab选中的标签序号
    queryKey = null;
    querypk = null; // 传入子组件中的查询pk
    metaType = null; // 传入子组件中的元数据类型
    showChildDetails = false; // 是否显示详情页
    PathArr = [];  // 存放路径字符串组成的数组
    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.queryMetaDetails();
        this.PathArr = this.getPathArr(this.deteailsInfo.namespace);
    }

    // 切换表、视图和存储过程
    ChangeTabList(x) {
        this.TabList = x;
        this.queryMetaDetails();
    }

    // 查询表、视图和存储过程
    queryMetaDetails() {
        let metatype = 'Table';
        const x = this.TabList;
        if (x === 0) {
            metatype = 'Table';
            this.detailsColHeaders = this.detailsTableColHeaders;
            this.detailsColumns = this.detailsTableColumns;
        } else if (x === 1) {
            metatype = 'View';
            this.detailsColHeaders = this.detailsViewColHeaders;
            this.detailsColumns = this.detailsOtherColumns;
        } else if (x === 2) {
            metatype = 'Procedure';
            this.detailsColHeaders = this.detailsProColHeaders;
            this.detailsColumns = this.detailsOtherColumns;
        }
        this.queryKey = metatype;
        if (!this.queryDetailspk) {
            return false;
        }
        this.deteailsTable = 'dwb/metamanage/query/childmetalist?pk='
            + this.queryDetailspk + '&metatype=' + metatype;
    }

    // 返回查询详情列表页
    backToQuery() {
        this.back.emit('back');
    }

    // 返回详情页
    backToMetaDetails($event) {
        this.showChildDetails = false;
        if ($event) {
            this.back.emit('back');
        }
    }

    // 通过value获取key
    getkeyByvalue(value) {
        const arr = [
            { code: 'Schema', name: '库' },
            { code: 'View', name: '视图' },
            { code: 'Table', name: '表' },
            { code: 'Column', name: '字段' },
            { code: 'Procedure', name: '存储过程' },
            { code: 'ALL', name: '全部' }
        ];
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

    // 显示子对象信息
    showChildDetailsInfo(item) {
        this.querypk = item.pk;
        this.metaType = item.meta_type;
        this.showChildDetails = true;
    }

    // 将路径分割成数组并分别展示
    getPathArr(str) {
        return Util.getArrByStr(str, '/');
    }

}
