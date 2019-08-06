import {
    AfterViewInit,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { ApiService } from '../../../../share/api.service';
import Util from '../../../../share/common/util';
import { NgYydatafinTableComponent } from 'ng-yydatafin/table';

@Component({
    selector: 'app-result-table',
    templateUrl: './result-table.component.html',
    styleUrls: ['./result-table.component.css']
})
export class ResultTableComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
    @Input() searchDate;
    @Output() recordDetails: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild('resultTable')
    private yyTable: NgYydatafinTableComponent;
    checkSchema = '';
    currentcheckSchema = '<span>检核库</span>' +
        '<span class="pull-triangle showSchema" title="筛选">' +
        '<i class="icon iconfont icon-APP_filter"></i>' +
        '</span>';
    ruleType = '';
    currentruleType = '<span>规则类型</span>' +
        '<span class="pull-triangle showRule" title="筛选">' +
        '<i class="icon iconfont icon-APP_filter"></i>' +
        '</span>';
    detailsColumnColHeaders = [this.currentcheckSchema, '检核表名', '检核字段', '检核日期', this.currentruleType, '规则名称', '问题记录'];
    detailsColumnColumns = [
        {
            columnSorting: false,
            data: 'ds_name'
        }, {
            data: 'table_name'
        }, {
            data: 'column_name'
        },
        {
            data: 'check_date'
        }, {
            columnSorting: false,
            data: 'rule_type',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                if (value !== null) {
                    td.innerHTML = '' + Util.getChcekRuleName(value) + '';
                } else {
                    td.innerHTML = '';
                }
                return td;
            }
        }, {
            data: 'rule_name'
        },
        {
            columnSorting: false,
            data: 'issue_recordcount',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = '';
                const item = instance.getSourceDataAtRow(instance.toPhysicalRow(row));
                const table_log = document.createElement('span');
                table_log.className = 'table-info hover-info';
                table_log.innerHTML = '' + value + '';
                table_log.addEventListener('click', () => {
                    this.showDetails(item);
                });
                td.appendChild(table_log);

                return td;
            }
        }
    ];

    resultTableUrl = '';
    searchParam = '';  // 存放查询参数
    showSchema = false; // 是否显示筛选采集状态的下拉列表
    Schematop; // 存放显示筛选采集状态的下拉列表的top属性
    Schemaleft; // 存放显示筛选采集状态的下拉列表的left属性
    SchemaFilterArr = [ // 筛选采集状态的数组
        '全部', 'a', 'b', 'c'
    ];
    showRule = false; // 是否显示筛选启用状态的下拉列表
    Ruletop;   // 存放显示筛选启用状态的下拉列表的top属性
    Ruleleft;  // 存放显示筛选启用状态的下拉列表的left属性
    RuleFilterArr = [ // 筛选启用状态的数组
        {
            zh_name: '全部',
            en_name: ''
        },
        {
            zh_name: '停用',
            en_name: '0'
        },
        {
            zh_name: '启用',
            en_name: '1'
        }
    ];


    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.resultTableUrl = 'dwb/dqmanage/check/issueRulelist?date=' + this.searchDate;
        this.getCheckSchemaList();
        this.getRulesTypeList();
    }

    ngAfterViewInit(): void {
        const that = this;
        const Table = $('#resultTable');
        Table.on('click', '.showSchema', () => {
            const el = $('.showSchema');
            const left = el.offset().left;
            const top = el.offset().top;
            that.Schematop = top + 15 + 'px';
            that.Schemaleft = left - 5 + 'px';
            that.showSchema = true;
        });
        Table.on('click', '.showRule', () => {
            const el = $('.showRule');
            const left = el.offset().left;
            const top = el.offset().top;
            that.Ruletop = top + 15 + 'px';
            that.Ruleleft = left - 5 + 'px';
            that.showRule = true;
        });
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off().on('mousedown', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag = $(obj).isChildAndSelfOf('.showjob');
            const flag2 = $(obj).isChildAndSelfOf('.showTrigger');
            const flag3 = $(obj).isChildAndSelfOf('.pull-down-div');
            if (!flag && !flag3) {
                that.showSchema = false;
            }
            if (!flag2 && !flag3) {
                that.showRule = false;
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.searchDate && !changes.searchDate.firstChange) {
            this.getDataList();
        }
    }

    ngOnDestroy(): void {
        $(window).off('click');
    }

    // 获取检核库列表
    getCheckSchemaList() {
        const date = this.searchDate;
        this.apiservice.getDataSourceList(date).then((res) => {
            if (res.code === 200) {
                this.SchemaFilterArr = res.data;
                this.SchemaFilterArr.unshift('全部');
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 获取规则类型列表
    getRulesTypeList() {
        this.apiservice.getRuleTypes().then((res) => {
            if (res.code === 200) {
                this.RuleFilterArr = res.data;
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 输入规则名称进行查询
    searchData() {
        this.getDataList();
    }

    // 检核库的筛选
    filterSchema(item) {
        this.checkSchema = item === '全部' ? '' : item;
        this.getDataList();
        this.showSchema = false;
    }

    // 检核规则的筛选
    filterRule(item) {
        this.ruleType = item.en_name;
        this.getDataList();
        this.showRule = false;
    }

    // 根据条件加载数据列表
    getDataList() {
        const date = this.searchDate;
        const rule_type = this.ruleType ? this.ruleType : '';
        const ds_name = this.checkSchema ? this.checkSchema : '';
        const rule_name = this.searchParam ? this.searchParam : '';
        const url = `dwb/dqmanage/check/issueRulelist?`;
        this.resultTableUrl = url + `date=${date}&rule_type=${rule_type}&ds_name=${ds_name}&rule_name=${rule_name}`;
    }

    // 点击问题记录数据时弹出窗口
    showDetails(item) {
        $('#showDetails').modal('show');
        this.recordDetails.emit(item);
    }
}
