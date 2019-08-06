import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { ApiService } from '../../../share/api.service';
import { WorkTreeComponent } from './work-tree/work-tree.component';
import { WorkSchesettingComponent } from './work-schesetting/work-schesetting.component';
import * as _ from 'lodash';
import Util, { default as util } from '../../../share/common/util';
import { LogService } from '../../../share/stream-sets/log.service';
import pipelineConstant from '../../../share/stream-sets/pipelineConstant';
import { PipelineService } from '../../../share/stream-sets/pipeline.service';

declare var $: any;

@Component({
    selector: 'app-work-manage',
    templateUrl: './work-manage.component.html',
    styleUrls: ['./work-manage.component.css']
})
export class WorkManageComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(WorkTreeComponent)
    private child: WorkTreeComponent;
    @ViewChild(WorkSchesettingComponent)
    private child2: WorkSchesettingComponent;
    showRightarea = true; // 存放是否显示右侧空文件夹区域
    pipelineConfig; // 存放当前作业的图形数据
    selectedType; // 当前图形选中的类型
    stageInstances; // 存放当前作业的节点数组
    edges; // 存放当前作业的连线数组
    stageSelected; // 是否选中的为节点
    selectedObject; // 当前选中的图形对象，未选中任何节点和连线，选中节点或选中节点
    taskObj = null; // 存放从右侧拖拽过来的任务对象
    taskObjList = []; // 存放当前展示的对象数组
    common = {
        isSource: true,        // 是否允许作为原点
        isTarget: true,        // 是否允许作为目标点
        maxConnections: -1,    // 是否限制连线条目数，-1为无限制
        connector: ['Bezier', {}], // 连线形状，贝塞尔曲线，
        // connector: ['Straight'],  // 连线形状，直线，
        connectorOverlays: [['PlainArrow',
            {
                width: 15,
                length: 15,
                location: 1,
                paintStyle: {
                    fill: '#c7c7c7'
                }
            }
        ]],
        endpoint: ['Dot', { radius: 25 }],
        paintStyle: {  // 端点的颜色样式
            fill: 'transparent',
            outlineStroke: 'transparent',
            strokeWidth: 1
        },
        hoverPaintStyle: {  // 端点鼠标经过的样式
            outlineStroke: 'transparent'
        },
        connectorStyle: {   // 连线的样式
            outlineStroke: '#c7c7c7',
            strokeWidth: 1
        },
        connectorHoverStyle: { // 连线鼠标经过的样式
            outlineStroke: '#c7c7c7',
            strokeWidth: 3

        },
        dragProxy: [['Blank'], {}]  // 拖动端点进行连线时的样式，隐藏端点
    };
    moidfyJobPK = null; // 存放当前作业的pk
    JobInfo = null; // 存放当前的作业的基本信息
    JobBaseInfoArr = [  // 存放当前作业的基本信息操作区域的数组
        {
            name: '基本信息',
            value: 'baseinfo',
            icon: 'icon-basicinformation',
            active: true
        },
        {
            name: '调度设置',
            value: 'setting',
            icon: 'icon-dw_settings',
            active: false
        },
        {
            name: '调度历史',
            value: 'history',
            icon: 'icon-Schedulhistory',
            active: false
        },
        {
            name: '日志',
            value: 'log',
            icon: 'icon-log',
            active: false
        }
    ];
    showInfoModule = 'baseinfo';
    activeTaskObj = null; // 存放当前作业图表中，被选中的任务对象
    selectedTask = false; // 存放是否选中了任务，如果没有选中任务，则选中当前作业
    stageLibraries = []; // 存放任务列表的右侧树
    Jobediting = false; // 存放当前任务是否被编辑过
    user = {
        userName: '',
        userCaption: ''
    };
    activeTaskInfo = null; // 当前选中的任务的基本信息
    activeJobInfo = {  // 当前选中的任务的基本信息
        creater: '',
        lastModify: '',
        name: '',
        create_time: '',
        ts: ''
    };
    TaskInfoArr = []; // 存放当前TaskInfo的数组
    showStopBtn = false; // 存放是否显示停止按钮
    windowHeight = null; // 存放当前窗口的高度，在设置高度时有用
    hiddenMainArea = false; // 存放是否隐藏主区域，详情区域最大化
    hideenDetailArea = false; // 存放是否隐藏详情区域，关系区域最大化
    showTaskList = true; // 存放是否显示右侧任务列表区域
    logList;
    constructor(private apiservice: ApiService, private pipelineService: PipelineService, private logService: LogService) {
    }

    ngOnInit() {
        this.windowHeight = window.innerHeight;
        this.user.userName = window.sessionStorage.getItem('userName');
        this.user.userCaption = window.sessionStorage.getItem('userCaption');
        this.apiservice.loadTaskList(null).then((res) => {
            if (res.code === 200) {
                const data = res.data;
                this.stageLibraries = this.TransformTreeArr2List(data);
            } else {
                Util.showMessage('获取数据失败', 'error');
            }
        });
    }


    ngAfterViewInit() {
    }

    // 将任务树数组转化为可供拖拽列表使用的数组
    TransformTreeArr2List(TreeArr) {
        const len = TreeArr.length;
        const arr = [];
        for (let i = 0; i < len; i++) {
            const obj = {
                name: TreeArr[i].name,
                show: true,
                active: false,
                pk: TreeArr[i].pk
            };
            arr.push(obj);
        }
        return arr;
    }

    ngOnDestroy() {
        $(window).off('click');
    }

    // 从关系图从删除节点的方法,需要删除节点并删除所有的端点和连线
    deleteItem() {
        this.pipelineService.triggerDeleteNode();
    }

    // 保存关系图节点和连线的操作
    saveGraph() {
        const graphs = _.cloneDeep(this.pipelineConfig);
        const userInfo = this.user.userCaption;
        const data = {
            pkJob: this.moidfyJobPK,
            graph: graphs.graph,
            user: userInfo
        };
        this.apiservice.modifyWorkTask(data).then((res) => {
            if (res.code === 200) {
                this.child2.saveScheSetting();
                this.getJobInfoByPk(this.moidfyJobPK, false);
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 拖拽经过事件
    Dropover($event) {
        $event.preventDefault();
    }


    // 如果正在运行中，打开websocket 用于接收日志
    addRunningWebsockets() {
        this.showInfoModule = 'log';
        const List = this.JobBaseInfoArr;
        const len = List.length;
        for (let i = 0; i < len; i++) {
            if (List[i].value === 'log') {
                List[i].active = true;
            } else {
                List[i].active = false;
            }
        }
        this.logService.addWebSocket(this.moidfyJobPK);
        if (this.logService.listener) {
            this.logService.listener.unsubscribe();
        }
        this.logService.listener = this.logService.onWebSocketMessage.subscribe((data: any) => {
            if (data.code === 3) {
                this.showStopBtn = false;
                return;
            }
            if (data.code === 2) {
                this.showStopBtn = false;
                util.showMessage('执行完毕或停止');
                return;
            }
            this.logList = this.logService.getLog(this.moidfyJobPK);
        });
    }

    // 立即执行当前作业
    ExecJob() {
        const JobPK = this.moidfyJobPK;
        const data = {
            businessId: JobPK,
            moduleId: 'dw',
            triggerName: this.JobInfo.name,
            buildCls: 'com.yonyou.dataworks.etl.job.EtlJobBuilder'
        };
        this.apiservice.newmetaExec(data).then((res) => {
            if (res.code === 200) {
                Util.showMessage('开始执行，稍后可查看执行状态！', 'success');
                this.showStopBtn = true;
                this.addRunningWebsockets();
                // 立即执行后，如果原作业没有调度设置，则会新增调度设置，此时刷新作业基本信息，并刷新作业的调度设置、调度历史和日志
                if (!this.JobInfo.trigger_id) {
                    this.getJobInfoByPk(JobPK, true);
                }
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 立即停止正在执行的作业
    StopJob() {
        const jobId = this.moidfyJobPK;
        this.apiservice.JobStop(jobId).then((res) => {
            if (res.code === 200) {
                // Util.showMessage('任务中止成功', 'success');
                this.showStopBtn = false;
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 当作业树改变时，刷新基本信息
    changeJobInfo($event) {
        this.getJobInfoByPk($event, false);
    }

    // 根据作业的pk获取作业的基本信息
    getJobInfoByPk(pk, boolean) {
        this.apiservice.getJobInfoByPK(pk).then((res) => {
            if (res.code === 200) {
                const Info = res.data;
                const activeInfo = this.activeJobInfo;
                const user = Info.create_user;
                const modify = Info.modify_user;
                activeInfo.ts = Info.ts;
                activeInfo.name = Info.name;
                activeInfo.create_time = Info.create_time;
                activeInfo.creater = user;
                activeInfo.lastModify = modify;
                this.JobInfo.trigger_id = Info.trigger_id;
                const obj = {
                    name: Info.name,
                    pk: pk,
                    trigger_id: Info.trigger_id
                };
                if (boolean) {
                    this.child2.getJobSche(obj);
                }
            } else {
            }
        });
    }

    // 查询已选中的任务的基本信息
    queryBaseInfo(item) {
        const pk = item.pk;
        const arr = this.TaskInfoArr;
        const obj = Util.getNameByKey(pk, arr, 'pk', 'value', null);
        if (obj) {
            this.activeTaskInfo = obj;
        } else {
            this.apiservice.queryTaskInfo(pk).then((res) => {
                if (res.code === 200) {
                    this.activeTaskInfo = res.data;
                    const obja = {
                        pk: '',
                        value: null
                    };
                    obja.pk = res.data.pk;
                    obja.value = this.activeTaskInfo;
                    this.TaskInfoArr.push(obja);
                }
            });
        }
    }

    // // 根据子组件传递来的对象，更改当前要复制的对象
    // changeTaskObj($event) {
    //     this.taskObj = $event;
    // }

    /**
     * 当在图上切换节点或者选中任务时执行.
     *
     * @param options
     */
    updateDetailPane(options) {
        const selectedObject = options.selectedObject;
        const type = options.type;
        if (type === pipelineConstant.STAGE_INSTANCE) {
            this.stageSelected = true;
            // Stage Instance Configuration
            this.selectedObject = selectedObject;
            this.queryBaseInfo(selectedObject);

        } else if (type === pipelineConstant.PIPELINE) {
            // Pipeline Configuration
            this.stageSelected = false;
            this.selectedObject = this.pipelineConfig;

        } else if (type === pipelineConstant.LINK) {
            this.selectedObject = selectedObject;
        }
    }

    // 执行选中节点或者任务
    changeStageSelection(options) {
        if (!options.type) {
            if (options.selectedObject && options.selectedObject.nodeName) {
                options.type = pipelineConstant.STAGE_INSTANCE;
            } else {
                options.type = pipelineConstant.PIPELINE;
            }
        }

        if (!options.ignoreBroadCast) {
            if (options.type !== pipelineConstant.LINK) {
                this.pipelineService.triggerSelectNode(options.selectedObject, options.moveToCenter);
            } else {
                this.pipelineService.triggerSelectEdge(options.selectedObject, options.moveToCenter);
            }
        }

        this.updateDetailPane(options);
    }

    // 通过点击事件添加的任务
    // 新增节点
    addStageInstance(params) {
        const options = params.options;
        const event = params.event;
        const stage = options.stage;
        const relativeXPos = options.relativeXPos;
        const relativeYPos = options.relativeYPos;
        let stageInstance;

        if (event) {
            event.preventDefault();
        }
        // 校验是否重复，如果重复且处于展示状态，则提示重复
        // const list = this.taskObjList;
        // const flag = Util.checkRepeat(list, 'pk', this.taskObj.pk, 'show');
        // if (flag) {
        //     Util.showMessage('不能重复添加或拖入同一个任务', 'warning');
        //     return false;
        // }
        // this.Jobediting = true;
        // // 如果重复但处于隐藏状态，则让其展示
        // const showFlag = Util.checkRepeatFalse(list, 'pk', this.taskObj.pk, 'show');
        // if (!showFlag) { // 如果showFlag返回null，说明没有重复
        //     list.push(this.taskObj);
        // } else { // 如果showFlag有返回值，说明有重复，且重复的值处于隐藏状态
        //     const i = showFlag.index;
        //     list[i].show = true;
        //     list[i].active = false;
        // }
        let flag = false;
        for (let i = 0; i < this.stageInstances.length; i++) {
            const sourceStageInstance = this.stageInstances[i];
            if (sourceStageInstance.pk === stage.pk) {
                flag = true;
            }
        }

        if (flag) {
            Util.showMessage('不能重复添加或拖入同一个任务', 'warning');
            return;
        }
        stageInstance = this.pipelineService.getNewStageInstance({
            stage: stage,
            relativeXPos: relativeXPos,
            relativeYPos: relativeYPos,
            pipelineConfig: this.pipelineConfig
        });
        this.changeStageSelection({
            selectedObject: stageInstance,
            type: pipelineConstant.STAGE_INSTANCE,
            ignoreBroadCast: true
        });
        this.pipelineService.triggerAddNode(stageInstance, relativeXPos, relativeYPos);
    }

    // 拖拽新增
    stageDrop(e) {
        const dragData = e.dataTransfer.getData('text');
        if (e && dragData) {
            const stage = JSON.parse(dragData);
            this.addStageInstance({
                options: {
                    stage: stage,
                    relativeXPos: e.offsetX - 120,
                    relativeYPos: e.offsetY
                }
            });
        }
    }

    // 更新变化
    updateGraph(pipelineConfig) {
        this.pipelineConfig = pipelineConfig || {};
        this.stageInstances = this.pipelineConfig.graph.nodes;
        const graphNodes = this.stageInstances;
        this.edges = this.pipelineConfig.graph.links;

        this.stageSelected = false;
        this.selectedObject = pipelineConfig;
        // 触发graph渲染
        this.pipelineService.triggerUpdateGraph({
            // fitToBounds: true,
            nodes: graphNodes,
            edges: this.edges,
            selectNode: (this.selectedType && this.selectedType === pipelineConstant.STAGE_INSTANCE) ? this.selectedObject : undefined,
            selectEdge: (this.selectedType && this.selectedType === pipelineConstant.LINK) ? this.selectedObject : undefined,
            isReadOnly: false
        });
    }

    // 读取作业的任务流程图
    getTaskGraph(pkJob) {
        this.apiservice.readTaskGraph(pkJob).then((res) => {
            this.showRightarea = false;
            if (res.code === 200) {
                const data = res.data;
                if (data) { // 如果传回的数据中有数据，则初始化该任务连线
                    this.pipelineConfig = data;
                    this.selectedType = pipelineConstant.PIPELINE;
                    this.updateGraph(this.pipelineConfig);
                }
            }
        });
    }

    // 切换treeNode任务节点，更新当前作业信息
    changeQuerydirPK($event) {
        if ($event === 'folder') {
            this.showRightarea = true;
        } else {
            this.moidfyJobPK = $event;
            this.getTaskGraph($event);
            this.queryJobStatus($event);
        }
        this.showInfoModule = 'baseinfo';
        this.resetBaseInfo();
        this.stageSelected = false;
        this.TaskInfoArr = [];
    }

    // 查询job的运行状态
    queryJobStatus(jobId) {
        this.apiservice.queryJobStatus(jobId).then((res) => {
            if (res.code === 200) {
                this.showStopBtn = (res.msg === 'STARTING' || res.msg === 'RUNNING');
                if (res.msg === 'STARTING' || res.msg === 'RUNNING') {
                    this.addRunningWebsockets();
                }
                this.logList = this.logService.getLog(jobId);
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 基本信息栏的状态重置
    resetBaseInfo() {
        const arr = this.JobBaseInfoArr;
        const len = arr.length;
        for (let i = 0; i < len; i++) {
            arr[i].active = false;
        }
        arr[0].active = true;
    }

    // 切换treeNode节点，更新当前作业信息
    changeTreeNode($event) {
        if ($event.type === 1) {
            this.JobInfo = $event;
            // 每次切换树的任务节点的时候，都更新基本信息和配置信息
            this.getJobInfoByPk($event.pk, true);
        } else {
            this.JobInfo = null;
        }
    }

    // 点击文件夹图标，新增作业
    newTreeFolder() {
        this.child.addJob();
    }

    // 基本信息切换显示
    checkActive(item) {
        this.showInfoModule = item.value;
        const List = this.JobBaseInfoArr;
        const len = List.length;
        for (let i = 0; i < len; i++) {
            List[i].active = false;
        }
        item.active = true;
    }


    // 校验图形是否编辑过

    // 详情区域最大化
    maxDetails() {
        this.hiddenMainArea = !this.hiddenMainArea;
    }

    // 详情区域最小化
    minDetails() {
        this.hideenDetailArea = !this.hideenDetailArea;
        this.hiddenMainArea = false;
    }

    // 隐藏右侧任务列表区域
    HiddenTaskList() {
        this.showTaskList = !this.showTaskList;
    }
}
