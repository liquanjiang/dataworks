import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { ApiService } from '../../../share/api.service';
import Util from '../../../share/common/util';
import * as _ from 'lodash';

declare var $: any;
declare var echarts: any;

@Component({
    selector: 'app-change-history',
    templateUrl: './change-history.component.html',
    styleUrls: ['./change-history.component.css']
})
export class ChangeHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
    MetalistArr = []; // 存放用来查询的元数据的下拉列表数组
    activeMeta = {
        name: '元数据1',
        key: 0
    };
    showMetaList = false; // 存放是否显示元数据的下拉列表
    timeStartValue = null; // 存放开始时间的时间戳
    timeEndValue = null; // 存放结束时间的时间戳
    startTime = ''; // 存放时间范围选择的开始时间
    endTime = '';  // 存放时间范围选择的结束时间
    currentSchemaArr = []; // 存放当前被选中展示的数据库
    currentSchemaPkArr = []; // 存放当前被选中展示的数据库pk的数组，用于查询使用
    selectedNames = null; // 存放所有被选中的数据库的名字组成的字符串，用','隔开
    PeriodArr = [
        {
            key: 'day',
            value: '日'
        },
        {
            key: 'month',
            value: '月'
        },
        {
            key: 'season',
            value: '季度'
        },
        {
            key: 'year',
            value: '年'
        }
    ];
    isSelectedAll = false; // 存放是否全部选中
    showPeriod = false; // 是否显示选择周期的下拉列表
    queryPeriod = {
        key: 'day',
        value: '日'
    }; // 选中的周期
    chartsIns = null; // 存放当前的echarts对象
    color = ['#98c05c', '#57b9d1', '#f5c244', '#4a95ec'];
    optionday = {
        color: ['#ff0000', '#ff7f00', '#f0ad4e', '#5cc85c', '#4c7daa', '#5bc0de', '#9400d3', '#e574b6'],
        tooltip: {
            trigger: 'item',
            axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                type: 'shadow',        // 默认为直线，可选为：'line' | 'shadow'
                shadowStyle: {
                    color: 'rgb(128, 128, 128)',
                    opacity: 0.5
                }
            },
            formatter: function (param, ticket) {
                const obj = ['新增', '修改', '删除'];
                const date = param.data[0];
                let str = '';
                const unit = param;
                const index = Math.floor(unit.seriesIndex / 4);
                const stra = unit.seriesName + obj[index] + ':';
                const data = unit.data[1];
                const color = unit.color;
                const colorspan = `<span style='display:inline-block;margin-right:5px;width:10px;` +
                    `height:10px;border-radius:50%;background:${color}'></span>`;
                str = str + colorspan + `<span>${stra}</span><span>${data}</span><br>`;
                const datestr = `<span style='margin-left:15px'>时间:${date}</span><br>`;
                return `<div class='toolDiv'>` + datestr + str + `</div>`;
            }
        },
        axisPointer: {            // 坐标轴指示器，坐标轴触发有效
            type: 'shadow',        // 默认为直线，可选为：'line' | 'shadow'
            shadowStyle: {
                color: '#dedede',
                opacity: 0.5
            }
        },
        legend: {
            data: [
                {
                    name: '表',
                    icon: 'circle'
                }, {
                    name: '视图',
                    icon: 'circle'
                }, {
                    name: '存储过程',
                    icon: 'circle'
                }, {
                    name: '字段',
                    icon: 'circle'
                }]
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: 50,
            containLabel: true
        },
        xAxis: {
            type: 'time',
            data: [],
            minInterval: 3600 * 1000 * 24,
            maxInterval: 3600 * 1000 * 24 * 5,
            splitLine: {
                show: true,
                lineStyle: {
                    color: '#ddd',
                    type: 'dashed'
                }
            },
            axisLine: {
                show: false,
                lineStyle: {
                    color: '#b7b7b7'
                }
            },
            axisTick: {
                show: false
            }
        },
        yAxis: {
            name: '单位/个',
            type: 'value',
            splitLine: {
                show: true,
                lineStyle: {
                    color: '#ddd',
                    type: 'dashed'
                }
            },
            axisLine: {
                lineStyle: {
                    color: '#b7b7b7',
                    width: 2,
                    opacity: 0.5
                }
            }
        },
        dataZoom: [{
            type: 'slider',
            xAxisIndex: 0,
            minSpan: 5,
            height: 15,
            bottom: 10,
            start: 0,
            end: 100,
            backgroundColor: '#eaeaea',
            fillerColor: '#BDBDBD',
            dataBackground: {
                lineStyle: {
                    color: '#fff'
                },
                areaStyle: {
                    color: '#FFF'
                }
            },
            handleStyle: {
                color: '#fff',
                borderWidth: 1,
                borderColor: '#cecece'
            },
            handleIcon: 'M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.' +
                '4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.' +
                '4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
            handleSize: 20
        }],
        series: []
    };
    showechartsDetails = false; // 是否显示echarts数据详情页
    queryObj = {  // 存放点击图表查询要传入子组件的参数对象
        queryType: null,
        queryName: null,
        displayName: null,
        queryDate: null,
        queryPeriod: null,
        seamonths: [],
        pks: []
    };
    optionData = null; // 存放查到的数据信息
    routerParams;

    constructor(private apiservice: ApiService, private activatedRoute: ActivatedRoute) {
    }

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe((params: Params) => {
            this.routerParams = {
                pks: params['pks'],
                date: params['date']
            };
        });
        this.setStartAndEndTime();
        this.initList();
        this.chartsIns = echarts.init(document.getElementById('echarts_div'));

        this.chartsIns.on('click', (params) => {
            if (params) {
                const arr = ['新增', '修改', '删除'];
                const index = Math.floor(params.seriesIndex / 4);
                const name = params.seriesName;
                const type = arr[index];
                this.queryObj.queryType = Util.getKeybyValue(type);
                this.queryObj.queryName = Util.getKeybyValue(name);
                this.queryObj.displayName = name + '-' + type;
                this.queryObj.queryDate = params.data[0];
                this.queryObj.queryPeriod = this.queryPeriod.key;
                this.queryObj.seamonths = params.data[2] ? params.data[2] : [];
                this.queryObj.pks = this.currentSchemaPkArr;
                this.showechartsDetails = true;
            }

        });
    }

    // 设置默认开始时间为上个月的今天，设置默认结束时间为今天
    setStartAndEndTime() {
        let date = new Date();
        if (this.routerParams && this.routerParams.date) {
            date = new Date(this.routerParams.date);
        }
        const day = date.toDateString();
        const time = Date.parse(day);
        this.timeEndValue = time;
        this.timeStartValue = time - 30 * 24 * 3600 * 1000;
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const today = date.getDate();
        const preDate = new Date(this.timeStartValue);
        const preYear = preDate.getFullYear();
        const preMonth = preDate.getMonth() + 1;
        const preDay = preDate.getDate();
        this.startTime = preYear + '-' + preMonth + '-' + preDay;
        this.endTime = year + '-' + month + '-' + today;
    }

    // 显示等待动画
    showLoading() {
        $('.loading').show();
    }

    // 隐藏等待动画
    hideLoading() {
        $('.loading').hide();
    }

    // 选中下拉列表的数据
    selectMeta(item) {
        item.selected = !item.selected;
    }

    ngAfterViewInit(): void {
        const that = this;
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off('click').on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag = $(obj).isChildAndSelfOf('.meta-name');
            const flag2 = $(obj).isChildAndSelfOf('.triangle');
            const flag3 = $(obj).isChildAndSelfOf('.selectData-area');
            const flag4 = $(obj).isChildAndSelfOf('.span-select');
            if (!flag && !flag2 && !flag3) {
                that.showMetaList = false;
            }
            if (!flag4) {
                that.showPeriod = false;
            }
        });
        // 初始化日期选择器
        this.initdatapicker();
        // 当窗口尺寸改变时，触发echarts重新调整尺寸
        $(window).off('resize').on('resize', () => {
            this.chartsIns.resize();
        });
    }

    // 查询数据库列表，生成下拉列表的选项
    initList() {
        this.apiservice.getAllSchema().then((res) => {
            if (res.code === 200) {
                this.MetalistArr = this.creatUlDatas(res.data);
                this.showLoading();
                this.searchData();
            } else {
                this.hideLoading();
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 根据数据库列表，生成下拉列表的选择项
    creatUlDatas(schemanames) {
        const len = schemanames.length;
        if (len === 0) {
            return [];
        }
        /*------------------------ 生成组成下拉列表的数组开始 ---------------------------------*/
        const arr = [];
        for (let i = 0; i < len; i++) {
            const obj = {
                name: '',
                pk: '',
                selected: false,
                namespace: ''
            };
            obj.name = schemanames[i].schemaname;
            obj.pk = schemanames[i].pk;
            obj.namespace = schemanames[i].namespace ? schemanames[i].namespace : '';
            arr.push(obj);
        }
        /*------------------------ 生成组成下拉列表的数组结束 ---------------------------------*/
        if (this.routerParams && this.routerParams.pks) {
            const pksArray = this.routerParams.pks.split(',');
            for (let i = 0; i < arr.length; i++) {
                if (!(pksArray.indexOf(arr[i].pk) < 0)) {
                    arr[i].selected = true;
                    const obja = {
                        name: arr[i].name,
                        namespace: arr[i].namespace,
                        pk: arr[i].pk
                    };
                    this.currentSchemaArr.push(obja);
                    this.currentSchemaPkArr.push(obja.pk);
                }
            }
            this.selectedNames = Util.getNamesByArr(this.currentSchemaArr, 'namespace', 'name');
        } else {
            // 设置默认选中和显示列表中的第一个数据库
            const index = 0;
            arr[index].selected = true;
            this.selectedNames = arr[index].namespace + arr[index].name;
            const obja = {
                name: arr[index].name,
                pk: arr[index].pk
            };
            this.currentSchemaArr.push(obja);
            this.currentSchemaPkArr.push(obja.pk);
        }
        return arr;
    }

    ngOnDestroy(): void {
        $(window).off('click').off('resize');
        $('.loading').hide();
    }

    // 元数据下拉框取消按钮
    cancelSelect() {
        this.showMetaList = false;
    }

    // 元数据下拉框的全选按钮
    SelectAll(array) {
        this.isSelectedAll = !this.isSelectedAll;
        const len = array.length;
        for (let i = 0; i < len; i++) {
            array[i].selected = this.isSelectedAll;
        }
    }

    // 元数据下拉框确定按钮
    confirmSelect(array) {
        const arr = [];
        const pkarr = [];
        const len = array.length;
        for (let i = 0; i < len; i++) {
            if (array[i].selected) {
                const obj = {
                    name: array[i].name,
                    namespace: array[i].namespace,
                    pk: array[i].pk
                };
                arr.push(obj);
                pkarr.push(obj.pk);
            }
        }
        this.currentSchemaArr = arr;
        this.currentSchemaPkArr = pkarr;
        this.selectedNames = Util.getNamesByArr(arr, 'namespace', 'name');
        this.showMetaList = false;
        const data = {
            pks: this.currentSchemaPkArr
        };
        if (data.pks.length === 0) {
            Util.showMessage('请至少选择一个数据库', 'warning');
            return false;
        }
        this.searchData();
        // 查询选中的数据库pk数组数据，然后生成echarts图
    }

    // 初始化日期选择器
    initdatapicker() {
        const that = this;
        const startobj = {
            autoclose: true,
            format: 'yyyy-mm-dd',
            language: 'zh-CN',
            weekStart: 0,
            minView: 2,
            todayHighlight: true,
            todayBtn: true,
            keyboardNavigation: true,
            pickerPosition: 'bottom-left'
        };

        const endobj = {
            autoclose: true,
            format: 'yyyy-mm-dd',
            language: 'zh-CN',
            weekStart: 0,
            minView: 2,
            todayHighlight: true,
            todayBtn: true,
            keyboardNavigation: true,
            pickerPosition: 'bottom-right'
        };
        $('#startTime').datetimepicker(startobj).on('changeDate', (e) => {
            const value = e.date.valueOf();
            if (!that.timeEndValue) {
                that.timeStartValue = value;
            } else {
                if (value > that.timeEndValue) {
                    Util.showMessage('开始时间不能晚于结束时间！', 'warning');
                    return false;
                } else {
                    that.timeStartValue = value;
                }
            }
            that.startTime = Util.formatDateTime(value).substring(0, 10);
        });
        $('#endTime').datetimepicker(endobj).on('changeDate', (e) => {
            const value = e.date.valueOf();
            if (!that.timeStartValue) {
                that.timeStartValue = value;
            } else {
                if (value < that.timeStartValue) {
                    Util.showMessage('结束时间不能早于开始时间！', 'warning');
                    return false;
                } else {
                    that.timeEndValue = value;
                }
            }
            that.endTime = Util.formatDateTime(value).substring(0, 10);
        });
    }

    // 通过设置条件搜索数据
    searchData() {
        // 验证搜索条件是否为空
        if (this.currentSchemaPkArr.length === 0) {
            Util.showMessage('请至少选择一个数据源', 'warning');
            this.hideLoading();
            return false;
        }
        if (!this.startTime) {
            Util.showMessage('请选择开始时间', 'warning');
            this.hideLoading();
            return false;
        }

        if (!this.endTime) {
            Util.showMessage('请选择结束时间', 'warning');
            this.hideLoading();
            return false;
        }
        const obj = {
            pks: this.currentSchemaPkArr,
            beginDate: this.startTime,
            endDate: this.endTime,
            statPeriod: this.queryPeriod.key
        };
        this.showLoading();
        const flag = this.queryPeriod.key === 'day';
        this.apiservice.changeQuery(obj).then((res) => {
            if (res.code === 200) {
                this.optionData = res.data;
                this.echartsInit(res.data, flag);
            } else {
                this.hideLoading();
                Util.showMessage('获取数据失败！', 'error');
            }
        });
    }

    // 切换周期选择
    selectPeriod(item) {
        this.queryPeriod = item;
        this.showPeriod = false;
        this.searchData();
    }

    // 绘制echarts图表
    echartsInit(data, flag) {
        if (data.length === 0) {
            this.hideLoading();
            return false;
        }
        if (flag) { // 以天为周期
            const option = _.cloneDeep(this.optionday);
            option.series = this.transformData(data);
            this.chartsIns.setOption(option);
        } else { // 以月、季度、年为周期
            const option = _.cloneDeep(this.optionday);
            const arr = [];
            const len = data.length;
            for (let i = 0; i < len; i++) {
                arr.push(data[i].date);
            }
            option.xAxis = null;
            option.xAxis = {
                type: 'category',
                data: arr,
                minInterval: 3600 * 1000 * 24,
                maxInterval: 3600 * 1000 * 24 * 5,
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#ddd',
                        type: 'dashed'
                    }
                },
                axisLine: {
                    show: false,
                    lineStyle: {
                        color: '#b7b7b7'
                    }
                },
                axisTick: {
                    show: false
                }
            };
            option.series = this.transformData(data);
            this.chartsIns.setOption(option);
        }
        this.hideLoading();
    }

    // 根据查询返回的数据，生成echarts需要的格式的参数
    transformData(data) {
        if (!data || data.length === 0) {
            return null;
        }
        const seriesArr = this.getSeries();
        const len = seriesArr.length;
        for (let i = 0; i < len; i++) {
            const s = seriesArr[i];
            s.data = this.getDataByType(s.name, s.stack, data);
            if ((i + 1) % 4 === 0) {
                const nu = (i + 1) / 4 - 1;
                const typeArr = ['A_COUNT', 'U_COUNT', 'D_COUNT'];
                const arr = ['新增', '修改', '删除'];
                s['label'] = {
                    show: true,
                    fontSize: '10px',
                    position: 'top',
                    color: '#000',
                    formatter: function (param) {
                        const k = data.findIndex((item) => {
                            return item.date === param.data[0];
                        });
                        const obj = data[k][typeArr[nu]];
                        const flag = Util.ObjectHasEqual(obj, 0);
                        const index = Math.floor(param.seriesIndex / 4);
                        if (flag) {
                            return '';
                        } else {
                            return arr[index];
                        }
                    }
                };
            }
        }
        return seriesArr;
    }

    // 生成series的基础数组
    getSeries() {
        const typeArr = ['表', '视图', '存储过程', '字段'];
        const stackArr = ['新增', '修改', '删除'];
        const seriesArr = [];
        const series = {
                name: '表',
                type: 'bar',
                stack: '新增',
                itemStyle: {
                    color: this.color[0]
                },
                data: [],
                encode: {
                    x: 0,
                    y: 1
                },
                barGap: '5%',
                tooltip: {}
            }
        ;
        for (let i = 0; i < 12; i++) {
            const index1 = i % 4;
            const index2 = Math.floor(i / 4);
            const se = _.cloneDeep(series);
            se.name = typeArr[index1];
            se.stack = stackArr[index2];
            se.itemStyle.color = this.color[index1];
            seriesArr.push(se);
        }
        return seriesArr;
    }

    // 根据数据类型和修改类型获取数据
    getDataByType(type, stack, array) {
        if (!type || !stack || !array || array.length === 0) {
            return [];
        }
        const a = Util.getKeybyValue(type);
        const b = Util.getKeybyValue(stack);
        const len = array.length;
        const data = [];
        for (let i = 0; i < len; i++) {
            const arr = [];
            arr[0] = array[i].date;
            arr[1] = array[i][b][a];
            arr[2] = array[i]['seamonths'];
            data.push(arr);
        }
        return data;
    }

    // 关闭详情页
    hideechartsDetails($event) {
        this.showechartsDetails = false;
    }
}
