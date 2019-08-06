import { Component, OnInit, Input, OnChanges, AfterViewInit } from '@angular/core';
import { StreamSetsService } from '../../../../share/stream-sets/stream-sets.service';
import { PipelineService } from '../../../../share/stream-sets/pipeline.service';
import { CommonService } from '../../../../share/stream-sets/common.service';
import pipelineConstant from '../../../../share/stream-sets/pipelineConstant';
import * as _ from 'lodash';
import Util, { default as util } from '../../../../share/common/util';
import { isArray } from 'util';
import { LogService } from '../../../../share/stream-sets/log.service';

@Component({
  selector: 'app-streamsets',
  templateUrl: './stream-sets.component.html',
  styleUrls: ['./stream-sets.component.css']
})
export class StreamSetsComponent implements OnInit, OnChanges, AfterViewInit {

    // 任务id
    @Input() pkTask;
    // 当前任务所有信息
    pipelineConfig;
    // 是否已初始化
    hasInit = false;
    // 右侧节点列表隐藏
    slideHidden = false;
    // 是否正在保存中
    configSaveInProgress = false;
    // 当前的任务的基本信息
    activeConfigInfo;
    // 所有节点
    stageInstances;
    // 所有连线
    edges = [];
    // 当前选中的类型，默认为任务
    selectedType = pipelineConstant.PIPELINE;
    // 当前选中的对象，节点或任务
    selectedObject;
    // 节点是否被选中
    stageSelected: boolean;
    // 当前任务是否正在执行中
    isPipelineRunning = false;
    // 右侧节点容器的类。用于显示和隐藏
    slidePanelClass = '';
    // 详情面板的类。用于最大化和缩小
    detailPanelClass = '';
    // 日志信息
    logList;
    // 监听websocket的实例
    listener;
    constructor(   private commonService: CommonService,
                   private streamSetsService: StreamSetsService,
                   private pipelineService: PipelineService,
                   private logService: LogService) { }

    ngOnInit() {
        this.hasInit = true;
        this.init();
    }

    ngAfterViewInit() {
    }

    ngOnChanges(changes) {
        if (this.hasInit) {
            this.init();
        }
    }

    // 初始化
    init() {
        this.logList = [];
        Promise.all([
            this.streamSetsService.getStage(this.pkTask),
            this.streamSetsService.getStageInfo(this.pkTask),
            this.streamSetsService.getStageStatus(this.pkTask, sessionStorage.getItem('userCaption'))
        ]).then((results) => {
            if (results[1].code === 200 && results[0].code === 200 && results[2].code === 200) {
                if (results[2].msg === 'RUNNING') {
                    this.isPipelineRunning = true;
                    this.addRunningWebsockets();
                } else {
                    this.isPipelineRunning = false;
                }
                this.logList = this.logService.getLog(this.pkTask);
                this.pipelineConfig = Object.assign({info: results[1].data}, results[0].data);
                this.updateGraph(this.pipelineConfig);
            } else {
                Util.showMessage('加载数据失败', 'error');
            }
        }).catch(error => {
            Util.showMessage(error, 'error');
        });
    }


    // 如果正在运行中，打开websocket 用于接收日志
    addRunningWebsockets() {
        this.logService.addWebSocket(this.pkTask);
        if (this.logService.listener) {
            this.logService.listener.unsubscribe();
        }
        this.logService.listener = this.logService.onWebSocketMessage.subscribe((data: any) => {
            if (data.code === 3) {
                this.isPipelineRunning = false;
                return;
            }
            if (data.code === 2) {
                this.isPipelineRunning = false;
                util.showMessage('执行完毕或停止');
                return;
            }
            this.logList = this.logService.getLog(this.pkTask);
        });
    }

    // 过滤数据用于保存
    filterConfigMapData(pipelineConfig) {
        if (!pipelineConfig.graph.nodes) {
            return;
        }
        for (let i = 0; i < pipelineConfig.graph.nodes.length; i++) {
            const nodeConfigs = pipelineConfig.graph.nodes[i].nodeConfigs;
            if (nodeConfigs && nodeConfigs.length > 0) {
                for (let j = 0; j < nodeConfigs.length; j++) {
                    if (nodeConfigs[j].configtype === 'mappingarray') {
                        if (nodeConfigs[j].value) {
                            if (isArray(nodeConfigs[j].value)) {
                                nodeConfigs[j].value = _.fromPairs(nodeConfigs[j].value.filter((temp) => {
                                    return temp[0] !== '';
                                }));
                            }
                        }
                    } else if (nodeConfigs[j].configtype === 'jsonarray') {
                        if (nodeConfigs[j].value.sysvarible) {
                            if (isArray(nodeConfigs[j].value.sysvarible)) {
                                nodeConfigs[j].value.sysvarible = _.fromPairs(nodeConfigs[j].value.sysvarible.filter((temp) => {
                                    return temp[0] !== '';
                                }));
                            }
                        }
                    }
                }
            }
        }
        return pipelineConfig;
    }

    /**
     * 保存
     */
    saveUpdates() {
        if (this.configSaveInProgress) {
            return;
        }
        this.configSaveInProgress = true;
        this.commonService.saveOperationInProgress++;

        if (!this.isPipelineRunning) {
            this.pipelineConfig.user = sessionStorage.getItem('userCaption');
            const pipelineConfig = _.cloneDeep(this.pipelineConfig);
            delete pipelineConfig.info;
            this.filterConfigMapData(pipelineConfig);
            this.streamSetsService.savePipelineConfig(pipelineConfig)
                .then((response) => {
                    this.configSaveInProgress = false;
                    this.commonService.saveOperationInProgress--;
                    util.showMessage(response.msg, response.code === 200 ? 'success' : 'error');
                })
                .catch((res) => {
                    this.configSaveInProgress = false;
                    this.commonService.saveOperationInProgress--;
                    util.showMessage(res.data, 'error');
                });
        }
    }

    // 删除
    clickDelete() {
        this.pipelineService.triggerDeleteNode();
    }

    // 更新变化
    updateGraph(pipelineConfig) {
        this.pipelineConfig = pipelineConfig || {};
        this.activeConfigInfo = this.commonService.activeConfigInfo = pipelineConfig.info;
        this.stageInstances = this.pipelineConfig.graph.nodes;
        const graphNodes = this.stageInstances;
        this.edges = this.pipelineConfig.graph.links;

        this.stageSelected = false;
        this.selectedObject = pipelineConfig;
        this.selectedType = pipelineConstant.PIPELINE;
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
        let sourceExists = false;
        if (stage.nodeType === pipelineConstant.SOURCE_STAGE_TYPE) {
            for (let i = 0; i < this.stageInstances.length; i++) {
                const sourceStageInstance = this.stageInstances[i];
                if (sourceStageInstance.nodeType === pipelineConstant.SOURCE_STAGE_TYPE) {
                    sourceExists = true;
                }
            }
        }

        if (sourceExists) {
            Util.showMessage('源节点已存在', 'error');
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

    /**
     * 当在图上切换节点或者选中任务时执行.
     *
     * @param options
     */
    updateDetailPane(options) {
        const selectedObject = options.selectedObject;
        const type = options.type;
        const optionsLength = Object.keys(options).length;

        if (this.selectedType === type &&
            this.selectedObject && selectedObject && optionsLength <= 2 &&
            ((type === pipelineConstant.PIPELINE &&
                this.selectedObject.pkTask === selectedObject.pkTask) ||
                (type === pipelineConstant.STAGE_INSTANCE &&
                    this.selectedObject.nodeName === selectedObject.nodeName))) {
            // Previous selection remain same
            return;
        }

        this.selectedType = type;

        if (type === pipelineConstant.STAGE_INSTANCE) {
            this.stageSelected = true;
            // Stage Instance Configuration
            this.selectedObject = selectedObject;

        } else if (type === pipelineConstant.PIPELINE) {
            // Pipeline Configuration
            this.stageSelected = false;
            this.selectedObject = this.pipelineConfig;

        } else if (type === pipelineConstant.LINK) {
            this.selectedObject = selectedObject;
        }
        // setTimeout(() => {
        //      this.pipelineService.triggerOnSelectionChange(options);
        // }, 50);
    }


    /**
     * 点击开始和结束按钮
     *
     */
    startOrStopPipeline() {
        const userCaption = sessionStorage.getItem('userCaption');
        if (this.isPipelineRunning) {
            this.streamSetsService.stopPipeline(this.pkTask, userCaption)
                .then(res => {
                    if (res.code === 200) {
                        this.isPipelineRunning = false;
                        util.showMessage(res.msg, 'success');
                    } else {
                        util.showMessage(res.msg, 'error');
                    }
                });
        } else {
            this.streamSetsService.startPipeline(this.pkTask, userCaption)
                .then(res => {
                    if (res.code === 200) {
                        this.isPipelineRunning = true;
                        if (this.selectedType !== pipelineConstant.PIPELINE) {
                            const options = {
                                selectedObject: this.pipelineConfig,
                                type: pipelineConstant.PIPELINE,
                                ignoreBroadCast: true
                            };
                            this.changeStageSelection(options);
                            this.pipelineService.triggerOnSelectionChange(options);
                        }
                        this.addRunningWebsockets();
                        util.showMessage(res.msg, 'success');
                    } else {
                        util.showMessage(res.msg, 'error');
                    }
                });
        }
    }

    // 右侧节点列表显示和隐藏
    slideClick() {
        this.slideHidden = !this.slideHidden;
        if (this.slideHidden) {
            this.slidePanelClass = 'slide-hidden';
        } else {
            this.slidePanelClass = '';
        }
    }

    // 点击最大化
    maxPanelClick(e) {
        if (e === 'max') {
            this.detailPanelClass = 'detail-max';
        } else {
            this.detailPanelClass = '';
        }

    }

    // 点击最小化
    minPanelClick(e) {
        if (e === 'min') {
            this.detailPanelClass = 'detail-min';
        } else {
            this.detailPanelClass = '';
        }

    }


    // 移动详情面板开始
    moveSpiltHandleStart(e) {
        // this.spiltHandleMove = true;
        document.onmousemove = this.moveSpiltHandle;
        document.onmouseup = this.moveSpiltHandleEnd;
    }

    // 移动详情面板中
    moveSpiltHandle(e) {
        const spiltHandle = document.getElementById('split-handler');
        const previousNode = spiltHandle.previousSibling as any;
        const nextNode = spiltHandle.nextSibling as any;
        const parentsNode = spiltHandle.parentNode as any;
        const targetTop = spiltHandle.getBoundingClientRect().top;
        const pointTop = e.pageY;
        const dHeight = pointTop - targetTop;
        const tempHeight = previousNode.offsetHeight  + dHeight;
        const tempTop = spiltHandle.offsetTop + dHeight;
        if (tempTop < 0 || tempTop > (parentsNode.offsetHeight - 51)) {
            return false;
        }
        spiltHandle.style.top = tempTop + 'px';
        previousNode.style.height = tempHeight + 'px';
        nextNode.style.top  = tempTop + 'px';
    }

    // 移动详情面板结束
    moveSpiltHandleEnd(e) {
        document.onmousemove = null;
        document.onmouseup = null;
    }

}
