import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../share/api.service';
import Util from '../../../share/common/util';
import { OnDestroy } from '@angular/core';

declare var $: any;

@Component({
    selector: 'app-query',
    templateUrl: './query.component.html',
    styleUrls: ['./query.component.css']
})
export class QueryComponent implements OnInit, OnDestroy {
    tableColHeaders = ['元数据名称', '类型', '路径信息', '修改时间'];
    tableColumns = [
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
                    this.showMetaDetails(item);
                });
                td.appendChild(table_info);
                return td;
            }
        },
        {
            data: 'meta_type',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                const item = instance.getSourceDataAtRow(instance.toPhysicalRow(row));
                td.innerHTML = this.getkeyByvalue(item.meta_type, this.typeArr);
                return td;
            }
        },
        {
            data: 'namespace'
        },
        {
            data: 'ts'
        }
    ];
    showMetaQuery = true;  // 是否显示查询表格区域和查询详情区域
    tableUrl = '';
    searchValue = {  //  存放搜索对象
        name: '',
        metatype: 'ALL'
    };
    typeArr = []; // 存放查询参数的类型参数的对象
    querypk = null; // 传入子组件中的查询pk
    metaType = null; // 传入子组件中的元数据类型
    showSearch = false; // 是否显示所有搜索条件下拉选项
    showColumnDetails = false; // 是否显示字段详情页
    ColumnDetailData = {}; // 存放字段详情页的数据
    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.getMetaTypeList();
    }

    ngOnDestroy() {
        $(window).off('click');
    }

    // 搜索数据
    searchMeta(searchValue) {
        if (!searchValue.name) {
            Util.showMessage('请输入元数据名称进行搜索！', 'warning');
            return false;
        }
        this.searchValue = searchValue;
        this.getMetaDatas();
    }

    // 切换搜索数据类型
    changeSearch(value) {
        this.searchValue.metatype = value;
        this.showSearch = false;
    }

    // 显示搜索条件下拉选项
    showSearchMeta() {
        const that = this;
        that.showSearch = true;
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off('click').on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag1 = $(obj).isChildAndSelfOf('#searchMeta');
            const flag2 = $(obj).isChildAndSelfOf('.select-ul');
            const flag = flag1 || flag2;
            if (!flag) {
                that.showSearch = false;
            }
        });
    }

    // 查询数据并更新列表
    getMetaDatas() {
        this.tableUrl = 'dwb/metamanage/query/metaretrievelist?name='
            + this.searchValue.name
            + '&metatype=' + this.searchValue.metatype;
    }

    // 获取元数据查询的类型列表
    getMetaTypeList() {
        this.apiservice.getMetaTypes().then(res => {
            if (res.code === 200) {
                this.typeArr = res.data;
            } else {
                console.log(res.msg);
            }
        });
    }

    // 显示元数据详情
    showMetaDetails(item) {
        this.querypk = item.pk;
        this.metaType = item.meta_type;
        if (this.metaType === 'Column') {
            this.apiservice.getMetaQueryDetail(item.pk).then((res) => {
                if (res.code === 200) {
                    this.ColumnDetailData = res.data;
                    this.showColumnDetails = true;
                } else {
                    Util.showMessage('获取数据失败' + res.msg, 'error');
                }
            });
        } else {
            this.showMetaQuery = false;
        }

    }

    // 从字段详情页返回搜索页
    backToPre($event) {
        this.showColumnDetails = false;
    }

    // 返回搜索列表页
    backToQuery($event) {
        this.showMetaQuery = true;
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
}
