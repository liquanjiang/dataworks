import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { ApiService } from '../../../share/api.service';
import Util from '../../../share/common/util';
import * as _ from 'lodash';

declare var echarts: any;
declare var $: any;

const schemaNames = [];

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy {
    topObjArr = [ // 头部四个区域的数据
        { name: '数据源', num: null, icon: 'schema' },
        { name: '数据表', num: null, icon: 'Table' },
        { name: '存储过程', num: null, icon: 'pro' },
        { name: '视图', num: null, icon: 'view' }
    ];
    colorsArr = ['#57b9d1',
        '#f5c244',
        '#98c05c',
        '#4a95ec',
        '#69ac5b',
        '#73564a',
        '#6040b0',
        '#4253af',
        '#f09c38',
        '#667c89']; // 存放echarts待选颜色数组
    searchObj = { // 搜索参数对象
        name: ''
    };
    updateTime = ''; // 存放当前图表数据的更新时间
    chartsIns; // 存放echarts实例对象
    nodesArr = [];  // 存放echarts节点数组
    linksArr = [];  // 存放echarts连线数组
    categories = [];  // 存放所有的数据类型
    legendData = [];  // 存放所有的数据类型
    schemaObjArr = [];   // 存放所有的数据库
    showUl = false; // 存放是否显示下拉库列表
    currentSchemaArr = []; // 存放当前被选中展示的数据库
    currentSchemaPkArr = []; // 存放当前被选中展示的数据库pk的数组，用于查询使用
    selectedNames = null; // 存放所有被选中的数据库的名字组成的字符串，用','隔开
    option = {
        color: this.colorsArr,
        tooltip: {
            show: true,   // 默认显示
            showContent: true, // 是否显示提示框浮层
            trigger: 'item',  // 触发类型，默认数据项触发
            triggerOn: 'mousemove | click',  // 提示触发条件，mousemove鼠标移至触发，还有click点击触发
            alwaysShowContent: false, //  默认离开提示框区域隐藏，true为一直显示
            showDelay: 0,  // 浮层显示的延迟，单位为 ms，默认没有延迟，也不建议设置。在 triggerOn 为 'mousemove' 时有效。
            hideDelay: 1000,  // 浮层隐藏的延迟，单位为 ms，在 alwaysShowContent 为 true 的时候无效。
            enterable: false,  // 鼠标是否可进入提示框浮层中，默认为false，如需详情内交互，如添加链接，按钮，可设置为 true。
            position: 'right',  // 提示框浮层的位置，默认不设置时位置会跟随鼠标的位置。只在 trigger 为'item'的时候有效。
            confine: false,  // 是否将 tooltip 框限制在图表的区域内。外层的 dom 被设置为 'overflow: hidden'，或者移动端窄屏，导致 tooltip 超出外界被截断时，此配置比较有用。
            transitionDuration: 0.4,  // 提示框浮层的移动动画过渡时间，单位是 s，设置为 0 的时候会紧跟着鼠标移动。
            formatter: function (params) {
                if (!params.data.class) {
                    return null;
                }
                if (params.data.class === '存储过程') {
                    return `<div class="toolDiv">` +
                        `<span>类型：</span>${params.data.class ? params.data.class : ''}<span></span><br>` +
                        `<span>名称：</span><span>${params.data.nodesName ? params.data.nodesName : ''}</span><br>` +
                        `</div>`;
                } else {
                    return `<div class="toolDiv">` +
                        `<span>类型：</span>${params.data.class ? params.data.class : ''}<span></span><br>` +
                        `<span>名称：</span><span>${params.data.nodesName ? params.data.nodesName : ''}</span><br>` +
                        `<span>字段：</span><span>${(params.data.value || params.data.value === 0) ? params.data.value + '个' : ''}</span>` +
                        `</div>`;
                }
            }
        },

        legend: { // 图例
            show: true,
            data: [],
            formatter: null,
            orient: 'vertical', // 'vertical'，图例垂直放置
            x: 'right',  // 'center' | 'left' | {number},
            y: '25%',  // 'center' | 'bottom' | {number}
            align: 'left'  // 图像在文字之前
        },
        series: [{
            type: 'graph',   //  关系图
            // name: '监控管理系统',   //  系列名称，用于tooltip的显示，legend 的图例筛选，在 setOption 更新数据和配置项时用于指定对应的系列。
            layout: 'force',   //  图的布局，类型为力导图，'circular' 采用环形布局，见示例 Les Miserables
            legendHoverLink: true,  //  是否启用图例 hover(悬停) 时的联动高亮。
            hoverAnimation: false,  //  是否开启鼠标悬停节点的显示动画
            coordinateSystem: null,  //  坐标系可选
            xAxisIndex: 0,   //  x轴坐标 有多种坐标系轴坐标选项
            yAxisIndex: 0,   //  y轴坐标
            symbolSize: 10,
            force: {   //  力引导图基本配置
                repulsion: [100, 200],  //  节点之间的斥力因子。支持数组表达斥力范围，值越大斥力越大。
                gravity: 0.25,  //  节点受到的向中心的引力因子。该值越大节点越往中心点靠拢。
                edgeLength: [10, 30],  //  边的两个节点之间的距离，这个距离也会受 repulsion。[10, 50] 。值越小则长度越长
                layoutAnimation: true // 因为力引导布局会在多次迭代后才会稳定，决定是否显示布局的迭代动画，在节点数据较多（>100）的时候不建议关闭，布局过程会造成浏览器假死。
            },
            roam: true,  //  是否开启鼠标缩放和平移漫游。默认不开启。如果只想要开启缩放或者平移，可以设置成 'scale' 或者 'move'。设置成 true 为都开启
            nodeScaleRatio: 0.6,  //  鼠标漫游缩放时节点的相应缩放比例，当设为0时节点不随着鼠标的缩放而缩放
            draggable: true,  //  节点是否可拖拽，只在使用力引导布局的时候有用。
            focusNodeAdjacency: true,  //  是否在鼠标移到节点上的时候突出显示节点以及节点的边和邻接节点。
            edgeSymbol: ['none', 'none'],  //  边两端的标记类型，可以是一个数组分别指定两端，也可以是单个统一指定。默认不显示标记，常见的可以设置为箭头，如下：edgeSymbol: ['circle', 'arrow']
            edgeSymbolSize: 10, //  边两端的标记大小，可以是一个数组分别指定两端，也可以是单个统一指定。
            itemStyle: { // 图形样式，有 normal 和 emphasis 两个状态。normal 是图形在默认状态下的样式；emphasis 是图形在高亮状态下的样式，比如在鼠标悬浮或者图例联动高亮时。
                label: {
                    show: false
                },
                borderType: 'solid',   //  图形描边类型，默认为实线，支持 'solid'（实线）, 'dashed'(虚线), 'dotted'（点线）。
                borderColor: 'transparent',   //  设置图形边框为透明
                borderWidth: 2,   //  图形的描边线宽。为 0 时无描边。
                opacity: 1 // 图形透明度。支持从 0 到 1 的数字，为 0 时不绘制该图形。默认0.5
            },
            lineStyle: {  // 关系边的公用线条样式。
                // color: 'rgba(255,0,255,0.4)',
                width: 1,
                type: 'solid', //  线的类型 'solid'（实线）'dashed'（虚线）'dotted'（点线）
                curveness: 0.3, //  线条的曲线程度，从0到1
                opacity: 0.5  // 图形透明度。支持从 0 到 1 的数字，为 0 时不绘制该图形。默认0.5
            },
            emphasis: {  //  高亮状态
                itemStyle: { // 图形样式，有 normal 和 emphasis 两个状态。normal 是图形在默认状态下的样式；emphasis 是图形在高亮状态下的样式，比如在鼠标悬浮或者图例联动高亮时。
                    label: {
                        show: false
                    },
                    borderType: 'solid',   //  图形描边类型，默认为实线，支持 'solid'（实线）, 'dashed'(虚线), 'dotted'（点线）。
                    borderColor: 'transparent',   //  设置图形边框为透明
                    borderWidth: 10,   //  图形的描边线宽。为 0 时无描边。
                    opacity: 1 // 图形透明度。支持从 0 到 1 的数字，为 0 时不绘制该图形。默认0.5
                },
                lineStyle: {
                    width: 3,
                    type: 'solid', //  线的类型 'solid'（实线）'dashed'（虚线）'dotted'（点线）
                    curveness: 0.3, //  线条的曲线程度，从0到1
                    opacity: 1  // 图形透明度。支持从 0 到 1 的数字，为 0 时不绘制该图形。默认0.5
                }
            },
            label: { //  图形上的文本标签
                normal: {
                    show: false,  // 是否显示标签。
                    position: 'inside',  // 标签的位置。['50%', '50%'] [x,y]
                    textStyle: {   // 标签的字体样式
                        color: '#cde6c7',   //  字体颜色
                        fontStyle: 'normal',  //  文字字体的风格 'normal'标准 'italic'斜体 'oblique' 倾斜
                        fontWeight: 'bolder',  //  'normal'标准'bold'粗的'bolder'更粗的'lighter'更细的或100 | 200 | 300 | 400...
                        fontFamily: 'sans-serif', //  文字的字体系列
                        fontSize: 12  //  字体大小
                    }
                },
                emphasis: { // 高亮状态
                    show: false,  // 是否显示标签。
                    position: 'inside',  // 标签的位置。['50%', '50%'] [x,y]
                    textStyle: {   // 标签的字体样式
                        color: '#cde6c7',   //  字体颜色
                        fontStyle: 'normal',  //  文字字体的风格 'normal'标准 'italic'斜体 'oblique' 倾斜
                        fontWeight: 'bolder',  //  'normal'标准'bold'粗的'bolder'更粗的'lighter'更细的或100 | 200 | 300 | 400...
                        fontFamily: 'sans-serif', //  文字的字体系列
                        fontSize: 12  //  字体大小
                    }
                }
            },
            edgeLabel: { // 线条的边缘标签
                normal: {
                    show: false
                },
                emphasis: { // 高亮状态

                }
            },
            data: [],
            categories: [], //  symbol name：用于和 legend 对应以及格式化 tooltip 的内容。 label有效
            links: []
        }]
    };
    searchUlArr = []; // 存放搜索结果列表的数组
    showSearchUl = false; // 存放是否显示搜索结果下拉列表
    showDataDetails = false; // 存放是否显示数据详情页
    querypk;  // 存放查询数据详情的pk,是每个数据节点的name属性
    metaType; // 存放要查询的数据节点的类型
    pullLeft; // 存放下拉框的位置left
    pullTop;  // 存放下拉框的位置Top

    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.initAllData();
        this.chartsIns = echarts.init(document.getElementById('echarts_div'));
        $(window).off('resize').on('resize', () => {
            this.chartsIns.resize();
        });
    }

    ngOnDestroy() {
        $(window).off('resize');
        $(window).off('click');
        $('.loading').hide();
    }

    // 显示等待动画
    showLoading() {
        $('.loading').show();
    }

    // 隐藏等待动画
    hideLoading() {
        $('.loading').hide();
    }

    // 加载所有数据
    initAllData() {
        this.showLoading();
        this.apiservice.getMapCount().then((res) => {
            if (res.code === 200) {
                this.schemaObjArr = this.creatUlDatas(res.data.schemanames);
                this.showDefault();
                this.topObjArr[0].num = res.data.schemanames.length;
                this.topObjArr[1].num = res.data.tablecount;
                this.topObjArr[2].num = res.data.procedurecount;
                this.topObjArr[3].num = res.data.viewcount;
                this.updateTime = res.data.ts;
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
        // 生成用于生成图例的数组
        /*------------------------ 生成数据库数组开始 ---------------------------------*/
        for (let i = 0; i < len; i++) {
            const schemaObj = {
                pk: '',
                name: '',
                namespace: ''
            };
            schemaObj.name = schemanames[i].schemaname;
            schemaObj.pk = schemanames[i].pk;
            schemaObj.namespace = schemanames[i].namespace;
            schemaNames.push(schemaObj);
        }
        /*------------------------ 生成数据库数组结束 ---------------------------------*/
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
        // 设置默认选中和显示数据最少的数据库
        const index = Util.getTheleast(schemanames, 100000, 'count');
        arr[index].selected = true;
        this.selectedNames = arr[index].namespace + arr[index].name;
        const obja = {
            name: arr[index].name,
            pk: arr[index].pk
        };
        this.currentSchemaArr.push(obja);
        this.currentSchemaPkArr.push(obja.pk);
        return arr;
    }

    // 显示默认echarts图表，默认显示数据最少的库的图表
    showDefault() {
        const data = {
            pks: this.currentSchemaPkArr
        };
        if (!data.pks || data.pks.length === 0) {
            this.hideLoading();
            return false;
        }
        // 查询第一个数据库的数据，然后生成echarts图
        this.apiservice.queryMetaSchema(data).then((res) => {
            if (res.code === 200) {
                this.creatData(res.data, false);
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 显示下拉库列表
    showUL() {
        if (this.schemaObjArr.length === 0) {
            Util.showMessage('没有可供选择的数据库！', 'warning');
            return false;
        }
        const pull = $('#Pulldown').offset();
        const left = pull.left;
        const top = pull.top;
        this.pullTop = top + 30;
        this.pullLeft = left - 287;
        const that = this;
        that.showUl = true;
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off('click').on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag1 = $(obj).isChildAndSelfOf('#showUL');
            const flag2 = $(obj).isChildAndSelfOf('.select-ul-div');
            const flag = flag1 || flag2;
            if (!flag) {
                that.showUl = false;
            }
        });
    }

    // 切换选中
    toggleCheck(item) {
        item.selected = !item.selected;
    }

    // 确认选中的数据库
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
        this.showUl = false;
        const data = {
            pks: this.currentSchemaPkArr
        };
        if (data.pks.length === 0) {
            Util.showMessage('请至少选择一个数据库', 'warning');
            return false;
        }
        this.showLoading();
        // 查询选中的数据库pk数组数据，然后生成echarts图
        this.apiservice.queryMetaSchema(data).then((res) => {
            if (res.code === 200) {
                const flag = res.data.length !== 1;
                this.creatData(res.data, flag);
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 取消选择
    cancelSelect() {
        // 取消选择时，根据当前选中的数据库数组，重新设置schemaObjArr
        const carr = this.currentSchemaPkArr;
        const arr = this.schemaObjArr;
        const len = arr.length;
        for (let i = 0; i < len; i++) {
            arr[i].selected = carr.includes(arr[i].pk);
        }
        this.showUl = false;
    }

    // 生成数据, 不同的数据库聚合在一起，并且分类
    creatData(data, bol) {
        const len = data.length;
        const categories = [];
        /*------------------------ 生成分类数组开始 ---------------------------------*/
        for (let i = 0; i < len; i++) {
            const obj = {
                name: '',
                symbol: 'roundRect'
            };
            obj.name = data[i].pk;
            categories.push(obj);
        }
        this.categories = categories;
        /*----------------------- 生成分类数组结束 --------------------------*/
        /*----------------------- 生成图例数组开始 --------------------------*/
        const legendData = [];
        for (let i = 0; i < len; i++) {
            const obj = {
                name: '',
                icon: 'roundRect'
            };
            obj.name = data[i].pk;
            legendData.push(obj);
        }
        this.legendData = legendData;
        /*--------------------------- 生成图例数组结束 -------------------------*/

        /*--------------------------- 生成nodes数组开始 ---------------------------*/
        const nodes = [];
        for (let i = 0; i < len; i++) {
            // 数据表类型的节点
            const tablelen = data[i].tables.length;
            for (let j = 0; j < tablelen; j++) {
                const nodeobj = {
                    category: 0,
                    class: '',
                    name: '88',
                    symbol: '',
                    nodesName: '',
                    value: 20,
                    x: null,
                    y: null,
                    symbolSize: 20
                };
                nodeobj.class = '数据表';
                nodeobj.category = i;
                nodeobj.nodesName = data[i].tables[j].meta_name;
                nodeobj.name = data[i].tables[j].pk;
                nodeobj.symbol = 'circle';
                const size = data[i].tables[j].column_count ? data[i].tables[j].column_count : 0;
                const sysize = size > 50 ? 50 : size;
                nodeobj.symbolSize = sysize + 7;
                nodeobj.value = size;
                nodes.push(nodeobj);
            }

            // 存储过程类型的节点
            const prolen = data[i].procedures.length;
            for (let j = 0; j < prolen; j++) {
                const nodeobj = {
                    category: 0,
                    class: '',
                    name: '88',
                    symbol: '',
                    nodesName: '',
                    value: 20,
                    x: null,
                    y: null,
                    symbolSize: 20
                };
                nodeobj.class = '存储过程';
                nodeobj.category = i;
                nodeobj.nodesName = data[i].procedures[j].meta_name;
                nodeobj.name = data[i].procedures[j].pk;
                nodeobj.symbol = 'rect';
                nodeobj.symbolSize = 10;
                nodeobj.value = 1;
                nodes.push(nodeobj);
            }

            // 视图类型的节点

            const viewlen = data[i].views.length;
            for (let j = 0; j < viewlen; j++) {
                const nodeobj = {
                    category: 0,
                    class: '',
                    name: '88',
                    symbol: '',
                    nodesName: '',
                    value: 20,
                    x: null,
                    y: null,
                    symbolSize: 20
                };
                nodeobj.class = '视图';
                nodeobj.category = i;
                nodeobj.nodesName = data[i].views[j].meta_name;
                nodeobj.name = data[i].views[j].pk;
                const size = data[i].views[j].column_count ? data[i].views[j].column_count : 0;
                const sysize = size > 50 ? 50 : size;
                nodeobj.symbolSize = sysize + 7;
                nodeobj.value = size;
                nodeobj.symbol = 'path://M100,0 L160,180 L10,60 L190,60 L40,180 Z';
                nodes.push(nodeobj);
            }
        }
        /*--- ------------------------- 生成nodes数组结束 ------------------*/

        /* ---------------------------  生成每一个库的核心节点开始----------------*/
        // 核心节点为假节点，颜色为透明，透明度为0，symbolSize为0，
        for (let i = 0; i < len; i++) {
            const nodeobj = {
                category: 0,
                class: 0,
                name: '88',
                symbol: '',
                value: 20,
                symbolSize: 0,
                x: 0,
                y: 0,
                fixed: false,
                nodesName: '',
                itemStyle: {
                    color: 'transparent'
                }
            };
            nodeobj.category = i;
            nodeobj.name = data[i].pk;
            nodeobj.nodesName = data[i].schemaname;
            nodes.push(nodeobj);
        }
        /* ---------------------------  生成每一个库的核心节点结束----------------*/

        /*--------------------------- 生成links数组开始 ---------------------------*/
        // links数组中添加真实关系连接线
        const links = [];
        for (let i = 0; i < len; i++) {
            // 生成每个库下的连线，每个库的连线从colorsArr中循环取出
            const color = Util.getColorByIndex(i, this.colorsArr);
            const relationLen = data[i].relations.length;
            for (let j = 0; j < relationLen; j++) {
                const linkobj = {
                    source: null,
                    target: null,
                    lineStyle: {
                        color: color,
                        opacity: 1
                    }
                };
                linkobj.source = data[i].relations[j].source;
                linkobj.target = data[i].relations[j].target;
                links.push(linkobj);
            }
        }

        // 在links数组中添加每个库下的节点与此库下的核心节点的连线，连线颜色为透明色,连线的宽度为0
        // 如果只有一个数据库，则不增加透明连线
        if (bol) {
            for (let i = 0; i < len; i++) {
                // 表类型节点与核心节点的连线
                const obj = {
                    source: null,
                    target: null,
                    lineStyle: {
                        color: 'transparent',
                        opacity: 0,
                        width: 0
                    },
                    emphasis: {
                        lineStyle: {
                            color: 'transparent',
                            opacity: 0,
                            width: 0
                        }
                    }
                };
                const tablelen = data[i].tables.length;
                for (let j = 0; j < tablelen; j++) {
                    const linkobj = _.cloneDeep(obj);
                    linkobj.source = data[i].pk;
                    linkobj.target = data[i].tables[j].pk;
                    links.push(linkobj);
                }

                // 存储过程类型节点与核心节点的连线
                const prolen = data[i].procedures.length;
                for (let j = 0; j < prolen; j++) {
                    const linkobj = _.cloneDeep(obj);
                    linkobj.source = data[i].pk;
                    linkobj.target = data[i].procedures[j].pk;
                    links.push(linkobj);
                }

                // 视图类型节点与核心节点的连线
                const viewlen = data[i].views.length;
                for (let j = 0; j < viewlen; j++) {
                    const linkobj = _.cloneDeep(obj);
                    linkobj.source = data[i].pk;
                    linkobj.target = data[i].views[j].pk;
                    links.push(linkobj);
                }
            }
        }
        /*--------------------------- 生成links数组结束 ---------------------------*/
        this.linksArr = links;
        this.nodesArr = nodes;
        this.chartInit();
    }

    // echarts图表初始化
    chartInit() {
        const option = _.cloneDeep(this.option);
        option.legend.data = this.legendData;
        option.series[0].categories = this.categories;
        option.series[0].data = this.nodesArr;
        option.series[0].links = this.linksArr;
        option.legend.formatter = function (params) {
            return Util.getNameByKey(params, schemaNames, 'pk', 'name', 'namespace');
        };
        this.chartsIns.setOption(option);
        setTimeout(() => {
            this.hideLoading();
        }, 20);
        this.chartsIns.on('click', (params) => {
            const data = params.data;
            this.metaType = Util.getKeyByClassName(data.class);
            this.querypk = data.name;
            this.showDataDetails = true;
        });
    }

    // 根据表名、视图名、存储过程名--搜索数据
    searchData(searchObj, e) { // 按enter搜索后 失去焦点
        const that = this;
        if (e) {
            e.target.blur();
        }
        if (!searchObj.name) {
            Util.showMessage('请输入搜索条件!', 'warning');
            return false;
        }
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off('click').on('click', function (ele) {
            const obj = $(ele.srcElement || ele.target);
            const flag1 = $(obj).isChildAndSelfOf('.search-bg-span');
            const flag2 = $(obj).isChildAndSelfOf('.search-div-ul-area');
            const flag = flag1 || flag2;
            if (!flag) {
                that.showSearchUl = false;
            }
        });
        const data = {
            name: searchObj.name,
            pks: this.currentSchemaPkArr
        };
        // 根据关键字和当前的数据库数组，搜索
        this.apiservice.queryMetaMapByName(data).then((res) => {
            if (res.code === 200) {
                this.searchUlArr = this.creatSearchUlArr(res.data);
                if (this.searchUlArr.length > 0) {
                    this.showSearchUl = true;
                }
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 生成搜索下拉列表数组的方法
    creatSearchUlArr(data) {
        const pkArr = this.currentSchemaPkArr;
        const arr = [];
        const len = data.length;
        for (let i = 0; i < len; i++) {
            // 获取数据的颜色，由于不同的数据库中会有相同的数据，因此以颜色区分
            // 获取查询到的数据库，在参数pkArr中的序号，以此来确定颜色
            const index = Util.getIndexByValue(pkArr, data[i].pk);
            const color = Util.getColorByIndex(index, this.colorsArr);
            // 表类型数据
            if (data[i].tables.length > 0) {
                const tablelen = data[i].tables.length;
                for (let j = 0; j < tablelen; j++) {
                    const obj = {
                        name: '',
                        pk: '',
                        color: color
                    };
                    obj.name = data[i].tables[j].meta_name;
                    obj.pk = data[i].tables[j].pk;
                    arr.push(obj);
                }
            }
            // 视图类型数据
            if (data[i].views.length > 0) {
                const viewslen = data[i].views.length;
                for (let j = 0; j < viewslen; j++) {
                    const obj = {
                        name: '',
                        pk: '',
                        color: color
                    };
                    obj.name = data[i].views[j].meta_name;
                    obj.pk = data[i].views[j].pk;
                    arr.push(obj);
                }
            }
            // 存储过程类型的数据
            if (data[i].procedures.length > 0) {
                const prolen = data[i].procedures.length;
                for (let j = 0; j < prolen; j++) {
                    const obj = {
                        name: '',
                        pk: '',
                        color: color
                    };
                    obj.name = data[i].procedures[j].meta_name;
                    obj.pk = data[i].procedures[j].pk;
                    arr.push(obj);
                }
            }
        }
        return arr;
    }

    // 搜索下拉选项的点击选中事件
    selectSearch(item) {
        const nodes = this.nodesArr;
        const len = nodes.length;
        let index = null;
        for (let i = 0; i < len; i++) {
            if (nodes[i].name === item.pk) {
                index = i;
                break;
            }
        }
        this.searchObj.name = item.name;
        this.showSearchUl = false;
        // 将选中的点高亮显示
        this.chartsIns.dispatchAction({
            type: 'focusNodeAdjacency', // 可选，系列 index，可以是一个数组指定多个系列
            seriesIndex: 0, // 可选，系列名称，可以是一个数组指定多个系列
            dataIndex: index  // 可选，数据的序号
        });
        // 将选中的点的提示框（tooltip）显示
        this.chartsIns.dispatchAction({
            type: 'showTip',
            seriesIndex: 0,
            dataIndex: index
        });
    }

    // 返回数据地图页
    backToMetaDetails($event) {
        this.metaType = null;
        this.querypk = null;
        this.showDataDetails = false;
    }

}
