import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ApiService } from '../../../share/api.service';
import Util from '../../../share/common/util';
import * as _ from 'lodash';

declare var $: any;
declare var echarts: any;

@Component({
    selector: 'app-check-result',
    templateUrl: './check-result.component.html',
    styleUrls: ['./check-result.component.css']
})
export class CheckResultComponent implements OnInit, AfterViewInit, OnDestroy {
    topObjArr = [ // 头部四个区域的数据
        { name: '数据源', num: null, total: null, icon: '', date: null, showTotal: false },
        { name: '问题规则数', num: null, total: null, icon: 'icon-rise', date: null, showTotal: true },
        { name: '问题记录数', num: null, total: null, icon: 'icon-decline', date: null, showTotal: true },
        { name: '报告日期', num: null, total: null, icon: 'date', date: '2018.12.12', showTotal: false }
    ];
    selectedDate; // 存放当前选中的日期，默认为今天
    pieOption = { // 存放饼状图的option对象
        color: ['#98c05c', '#57b9d1', '#f5c244', '#4a95ec', '#fa52de', '#e574b6', '#5bc0de', '#9400d3'],
        title: {
            text: '问题规则占比',
            textStyle: {
                color: '#333',
                fontWeight: 500,
                fontSize: 14
            },
            left: 20,
            top: 10
        },
        tooltip: {
            trigger: 'item',
            formatter: function (param) {
                const sName = param.seriesName;
                const name = param.name;
                const dname = param.data.dname;
                const value = param.data.value;
                const percent = param.percent;
                return `${sName} <br/>${name} : ${dname} (${value}%)<br/>饼图比例 : ${percent}%`;
            }
        },
        legend: {
            orient: 'vertical',
            right: 10,
            bottom: 20,
            align: 'left',
            data: ['database3', '贴源层', '数据库2']
        },
        series: [
            {
                name: '问题规则占比',
                type: 'pie',
                radius: ['45%', '75%'],
                center: ['50%', '50%'],
                data: [
                    { value: 335, name: 'database3' },
                    { value: 310, name: '贴源层' },
                    { value: 234, name: '数据库2' }
                ],
                label: {
                    show: true,
                    formatter: function (param) {
                        return param.data.name;
                    }
                },
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };

    barOption = { // 存放柱状图的option对象
        color: ['#98c05c', '#57b9d1', '#f5c244', '#4a95ec', '#fa52de', '#e574b6', '#5bc0de', '#9400d3'],
        title: {
            text: '问题记录数占比',
            textStyle: {
                color: '#333',
                fontWeight: 500,
                fontSize: 14
            },
            left: 20,
            top: 10
        },
        legend: {
            orient: 'horizontal',
            left: 'center',
            bottom: 10,
            align: 'left',
            data: []
        },
        xAxis: {
            type: 'category',
            data: [],
            splitLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                rotate: 20
            },
            name: '数据源'
        },
        yAxis: {
            type: 'value',
            max: 100,
            splitLine: {
                show: false
            },
            axisTick: {
                show: false
            }
        },
        gird: {
            top: '15%',
            left: '10%'
        },
        tooltip: {
            trigger: 'item',
            formatter: function (param) {
                const sName = param.seriesName;
                const name = param.name;
                const dname = param.data.dname;
                const value = param.data.value;
                return `${sName} <br/>${name} :  ${dname} (${value}%)`;
            }
        },
        series: [
            {
                name: '问题记录数占比',
                stack: 'num',
                data: [],
                type: 'bar',
                itemStyle: {
                    color: '#f5c244'
                },
                barGap: '5%',
                barMaxWidth: '30%',
                label: {
                    show: true,
                    position: 'top',
                    formatter: function (param) {
                        return param.data.value + '%';
                    }
                }
            }
        ]
    };
    pieChartInit; // 存放饼状图的echarts对象
    barChartInit; // 存放柱状图的echarts对象
    showRecord = false; // 存放是否显示问题记录详情页
    queryObj = null; // 存放将要传到问题记录详情页的查询参数
    nopiedata = false; // 存放是否有饼图数据
    nobardata = false; // 存放是否有柱状图数据
    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.showLoading();
        this.selectedDate = Util.setTimeNowStr().substring(0, 10);
        this.getHeaderData();
        this.pieChartInit = echarts.init(document.getElementById('pieCharts'));
        this.barChartInit = echarts.init(document.getElementById('barCharts'));
        this.getEchartsData();
    }


    ngAfterViewInit(): void {
        // 初始化日期选择器
        this.initdatapicker();
        // 当窗口尺寸改变时，触发echarts重新调整尺寸
        $(window).on('resize', () => {
            this.barChartInit.resize();
            this.pieChartInit.resize();
        });
        $('.check-result').on('scroll', function () {
            $('#showTime').datetimepicker('hide');
        });
    }

    ngOnDestroy(): void {
        $(window).off('click').off('resize');
        $('.check-result').off('scroll');
    }

    // 显示时间选择窗口
    showTimeWindow() {
        $('#showTime').datetimepicker('show');
    }

    // 显示等待动画
    showLoading() {
        $('.loading').show();
    }

    // 隐藏等待动画
    hideLoading() {
        $('.loading').hide();
    }

    // 获取头部具体数据
    getHeaderData() {
        const date = this.selectedDate;
        this.topObjArr[0].num = 4;
        this.apiservice.getCheckResult(date).then((res) => {
            if (res.code === 200) {
                const data = res.data;
                this.topObjArr[0].num = data.dscount;
                this.topObjArr[1].num = data.issue_rulecount;
                this.topObjArr[1].total = data.total_rulecount;
                const trend = data.issue_rule_trend;
                const trend2 = data.issue_record_trend;
                this.topObjArr[1].icon = trend === '-1' ? 'icon-decline' : (trend === '1' ? 'icon-rise' : 'icon-equal');
                this.topObjArr[2].num = data.issue_recordcount;
                this.topObjArr[2].total = data.total_recordcount;
                this.topObjArr[2].icon = trend2 === '-1' ? 'icon-decline' : (trend2 === '1' ? 'icon-rise' : 'icon-equal');
            } else {
                this.hideLoading();
                Util.showMessage('获取数据失败!', 'error');
            }
        });
    }

    // 加载图表数据，并绘制图表
    getEchartsData() {
        this.showLoading();
        const date = this.selectedDate;
        this.apiservice.queryEchartsData(date).then((res) => {
            if (res.code === 200) {
                const piedata = res.data.issue_rule_percent;
                const bardata = res.data.issue_record_collect;
                this.nobardata = bardata.length === 0;
                this.nopiedata = piedata.length === 0;
                const pie = this.transformData('pie', piedata);
                const bar = this.transformData('bar', bardata);
                this.InitCharts(pie, bar);
            } else {
                this.hideLoading();
                Util.showMessage('获取数据失败!', 'error');
            }
        });
    }

    // 转化echarts数据
    transformData(type, data) {
        const len = data.length;
        if (type === 'pie') {
            const legenddata = [];
            const seriesData = [];
            for (let i = 0; i < len; i++) {
                if (data[i].issue_count > 0) {
                    legenddata.push(data[i].dsname);
                    const total = data[i].total_count;
                    const issue = data[i].issue_count;
                    const num = (issue / total * 100).toFixed(2);
                    const obj = {
                        value: num,
                        dname: issue + '/' + total,
                        name: data[i].dsname
                    };
                    seriesData.push(obj);
                }
            }
            return {
                legenddata: legenddata,
                seriesData: seriesData
            };
        } else if (type === 'bar') {
            const xAxisData = [];
            const seriesData = [];
            for (let i = 0; i < len; i++) {
                const num1 = data[i].correct_record;
                const num2 = data[i].issue_record;
                const sum = num1 + num2;
                if (sum !== 0 && num2 !== 0) {
                    const num3: any = num2 / sum;
                    const result = (num3 * 100).toFixed(2);
                    const obj = {
                        dname: num2 + '/' + sum,
                        value: result
                    };
                    seriesData.push(obj);
                    xAxisData.push(data[i].dsname);
                }
            }
            this.nobardata = seriesData.length === 0;
            return {
                xAxisData: xAxisData,
                seriesData: seriesData
            };
        }
    }

    // 生成echarts图表
    InitCharts(pie, bar) {
        const option = _.cloneDeep(this.pieOption);
        option.legend.data = pie.legenddata;
        option.series[0].data = pie.seriesData;
        this.pieChartInit.setOption(option);
        const option2 = _.cloneDeep(this.barOption);
        option2.xAxis.data = bar.xAxisData;
        option2.series[0].data = bar.seriesData;
        this.barChartInit.setOption(option2);
        this.hideLoading();
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
            pickerPosition: 'bottom-left',
            endDate: new Date()
        };
        $('#showTime').datetimepicker(startobj).on('changeDate', (e) => {
            const value = e.date.valueOf();
            that.selectedDate = Util.formatDateTime(value).substring(0, 10);
            that.getHeaderData();
            that.getEchartsData();
        });
    }

    // 点击展示问题记录详情
    showRecordDetails($event) {
        this.queryObj = $event;
        this.showRecord = true;
    }
}
