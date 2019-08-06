import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../../share/api.service';
import Util from '../../../../share/common/util';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {
    @Input() querypk;
    @Input() metaType;
    @Input() typeArr;
    @Output() back: EventEmitter<any> = new EventEmitter<any>();
    detailsTableColHeaders = ['表名称', '注释', '采集时间'];
    detailsViewColHeaders = ['视图名称', '采集时间'];
    detailsProColHeaders = ['过程名称', '采集时间'];
    detailsColumnColHeaders = ['字段名称', '注释', '字段类型', '是否允许空', '采集时间'];
    detailsColHeaders = []; // 存放表格的表头信息
    detailsColColumns = []; // 存放表格的内容信息
    detailsTableColumns = [
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
    detailsColumns = [
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
    detailsColumnColumns = [
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
            data: 'dataType'
        },
        {
            data: 'nullable'
        },
        {
            data: 'ts'
        }
    ];
    metaDetailData = {
        meta_name: '',
        meta_type: '',
        ts: '',
        namespace: '',
        sql: '',
        dataType: '',
        nullable: null,
        meta_comment: null
    };
    activeIndex = 0;
    tablist = [
        { name: '表', value: 'Table' },
        { name: '视图', value: 'View' },
        { name: '存储过程', value: 'Procedure' }
    ];
    tableUrl = ''; // 存放当前存储过程数组
    paramKey = '';
    param = {
        pk: '',
        metatype: ''
    };
    childQueryPk = null; // 存放子对象的查询pk
    childMetatype = null; // 子对象的类型
    showChildDetails = false; // 是否显示详情页
    relationPK = null; // 查询影响关系的pk
    bloodPK = null; // 查询血缘关系的pk
    headersArr = [];
    PathArr = [];  // 存放路径字符串组成的数组
    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.getMetaDetailsInfo();
        const arr = this.headersArr;
        arr.push(this.detailsTableColHeaders);
        arr.push(this.detailsViewColHeaders);
        arr.push(this.detailsProColHeaders);
    }

    // 获取当前查询的元数据信息
    getMetaDetailsInfo() {
        const pk = this.querypk;
        this.apiservice.getMetaQueryDetail(pk).then(res => {
            if (res.code === 200) {
                // 显示详情模块
                const data = res.data;
                this.metaDetailData = data;
                this.PathArr = this.getPathArr(data.namespace);
                const type = data.meta_type;
                this.tablist = this.getInfoByMetatype(type);
                const childrenType = data.childtype ? data.childtype[0] : '';
                const datapk = data.pk;
                if (childrenType) {
                    this.getMetaChildren(datapk, childrenType);
                }
            } else {
                Util.showMessage('获取数据失败' + res.msg, 'error');
            }
        });
    }

    // 根据主键查询子对象的信息
    getMetaChildren(datapk, childrenType) {
        this.paramKey = childrenType;
        switch (childrenType) {
            case 'Column':
                this.detailsColHeaders = this.detailsColumnColHeaders;
                this.detailsColumns = this.detailsColumnColumns;
                break;
            case 'Table':
                this.detailsColHeaders = this.detailsTableColHeaders;
                this.detailsColColumns = this.detailsTableColumns;
                break;
            case 'View':
                this.detailsColHeaders = this.detailsViewColHeaders;
                this.detailsColColumns = this.detailsColumns;
                break;
            case 'Procedure':
                this.detailsColHeaders = this.detailsProColHeaders;
                this.detailsColColumns = this.detailsColumns;
                break;
            default:
                this.detailsColHeaders = [];
                break;
        }
        this.tableUrl = 'dwb/metamanage/query/childmetalist?pk='
            + datapk + '&metatype=' + childrenType;
    }

    // 返回查询详情列表页
    backToQuery() {
        this.back.emit('back');
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

    // 根据元数据类型获取显示信息的种类
    getInfoByMetatype(metatype) {
        switch (metatype) {
            case 'Schema' :
                return [
                    { name: '表', value: 'Table' },
                    { name: '视图', value: 'View' },
                    { name: '存储过程', value: 'Procedure' }
                ];
            case 'Table' :
                return [
                    { name: '字段', value: 'Column' },
                    { name: '影响关系', value: 'relation' },
                    { name: '血缘关系', value: 'blood' }
                ];
            case 'View' :
                return [
                    { name: '字段', value: 'Column' }
                ];
            case 'Procedure' :
                return [];
            case 'Column' :
                return [];
            default:
                return [];
        }
    }

    // 切换table页
    Listtab(i, metaType, value) {
        const pk = this.querypk;
        if (value !== 'relation' && value !== 'blood') {
            this.getMetaChildren(pk, value);
        } else if (value === 'relation') {
            this.relationPK = pk;
        } else if (value === 'blood') {
            this.bloodPK = pk;
        }
        this.activeIndex = i;
    }

    // 根据英文返回汉字
    getCNbyEN(en) {
        switch (en) {
            case 'true' :
                return '是';
            case 'false':
                return '否';
        }
    }

    // 返回数据详情
    backToMetaDetails($event) {
        if ($event) {
            this.back.emit('back');
        }
        this.showChildDetails = false;
    }

    // 显示子对象信息
    showChildDetailsInfo(item) {
        this.childQueryPk = item.pk;
        this.childMetatype = item.meta_type;
        this.showChildDetails = true;
    }

    // 将路径分割成数组并分别展示
    getPathArr(str) {
        return Util.getArrByStr(str, '/');
    }

}
