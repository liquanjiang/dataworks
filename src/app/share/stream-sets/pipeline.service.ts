import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import pipelineConstant from './pipelineConstant';
import { Subject } from 'rxjs/Subject';
@Injectable({
  providedIn: 'root'
})
export class PipelineService {
    initializeDefer = undefined;
    addNode = new Subject(); // 更新事件的可观察对象
    deleteNode = new Subject();
    selectNode = new Subject(); // 更新事件的可观察对象
    selectEdge = new Subject(); // 更新事件的可观察对象
    onSelectionChange = new Subject(); // 更新事件的可观察对象
    updateGraph = new Subject(); // 更新事件的可观察对象

    constructor() { }

    sortStageInstances(stages) {
        if (!stages || stages.length === 0) {
            return stages;
        }
        const sorted = [];
        const removedMap = {};
        const producedOutputs = [];
        let ok = true;
        let iteration = 0;
        while (ok) {
            const prior = sorted.length;
            for (let i = 0; i < stages.length; i++) {
                const t = stages[i];
                if (!removedMap[t.instanceName]) {
                    const alreadyProduced = _.filter(producedOutputs, function(p) {
                        return t.inputLanes.indexOf(p) !== -1;
                    });
                    if (alreadyProduced.length === t.inputLanes.length) {
                        producedOutputs.push.apply(producedOutputs, t.outputLanes);
                        producedOutputs.push.apply(producedOutputs, t.eventLanes);
                        removedMap[t.instanceName] = true;
                        sorted.push(t);
                    }
                }
            }
            iteration++;
            if (prior === sorted.length && iteration >= sorted.length) {
                ok = false;
                for (let i = 0; i < stages.length; i++) {
                    const t = stages[i];
                    if (!removedMap[t.instanceName]) {
                        sorted.push(t);
                    }
                }
            }
        }
        return sorted;
    }

    /**
     * 返回节点图标的url
     *
     * @param stage
     * @returns {string}
     */
    getStageIconURL(stage, error) {
        if (!error) {
            return 'dwb/resources/task/icon/' + stage.pk.replace(/^\s+|\s+$/g, '') + '-0.svg';
        } else {
            switch (stage.nodeType) {
                case pipelineConstant.SOURCE_STAGE_TYPE:
                    return 'dataworks/assets/stage/defaultSource.svg';
                case pipelineConstant.PROCESSOR_STAGE_TYPE:
                    return 'dataworks/assets/stage/defaultProcessor.svg';
                case pipelineConstant.TARGET_STAGE_TYPE:
                    return 'dataworks/assets/stage/defaultTarget.svg';
            }
        }
    }

    /**
     * 获取节点的显示名称
     * @param stage 当前节点
     * @param pipelineConfig 所有配置项
     * @returns {string}
     */
    getStageLabel(stage, pipelineConfig) {
        const label = stage.nodeName;

        const similarStageInstances = _.filter(pipelineConfig.graph.nodes, function(stageInstance) {
            return stageInstance.nodeName.indexOf(label) !== -1;
        });

        return label + ' ' + (similarStageInstances.length + 1);
    }

    /***
     * 获取新增节点的x坐标
     * @param pipelineConfig
     * @returns {number}
     */
    getXPos(pipelineConfig) {
        const prevStage = (pipelineConfig.graph.nodes && pipelineConfig.graph.nodes.length)
            ? pipelineConfig.graph.nodes[pipelineConfig.graph.nodes.length - 1] : undefined;
        let tempX = 60;
        if (prevStage) {
            const positions = prevStage.position.split(',');
            const xPos = Number(positions[0]);
            tempX = xPos + 220;
        }
        return tempX;
    }

    /***
     * 获取新增节点的y坐标
     * @param pipelineConfig
     * @returns {number}
     */
    getYPos(pipelineConfig, xPos) {
        let maxYPos = 0;
        for (let i = 0; i < pipelineConfig.graph.nodes.length; i++) {
            const stage = pipelineConfig.graph.nodes[i];
            const positions = stage.position.split(',');
            const stageXPos = Number(positions[0]);
            const stageYPos = Number(positions[1]);
            if (stageXPos === xPos && stageYPos > maxYPos) {
                maxYPos = stageYPos;
            }
        }
        return maxYPos ? maxYPos + 150 : 50;
    }

    /**
     * 获取新增节点的实例
     * @param options
     * @returns {any}
     */
    getNewStageInstance (options) {
        const stage = options.stage;
        const relativeXPos = options.relativeXPos;
        const relativeYPos = options.relativeYPos;
        const pipelineConfig = options.pipelineConfig;
        const xPos = relativeXPos || this.getXPos(pipelineConfig);
        const yPos = relativeYPos || this.getYPos(pipelineConfig, xPos);
        let stageInstance;
        if (stage.nodeType) {
            const stageLabel = this.getStageLabel(stage, pipelineConfig);
            stageInstance = {
                nodeName: stageLabel,
                position: xPos + ',' + yPos,
                nodeType: stage.nodeType,
                nodeConfigs: stage.nodeConfigs,
                pk: stage.pk
            };
        } else {
            stageInstance = {
                nodeName: stage.name,
                position: xPos + ',' + yPos,
                pk: stage.pk
            };
        }
        return stageInstance;
    }

    /**
     * 触发新增节点事件
     * @param stageInstance
     * @param relativeXPos
     * @param relativeYPos
     */
    triggerAddNode(stageInstance, relativeXPos, relativeYPos) {
        this.addNode.next(
            {
                stageInstance: stageInstance,
                relativeXPos: relativeXPos,
                relativeYPos: relativeYPos
            }
        );
    }

    /**
     * 触发删除节点事件
     */
    triggerDeleteNode() {
        this.deleteNode.next();
    }

    /**
     * 触发选中节点事件
     * @param selectedObject
     * @param moveToCenter
     */
    triggerSelectNode(selectedObject, moveToCenter) {
        this.selectNode.next({
            selectedObject: selectedObject,
            moveToCenter: moveToCenter});
    }

    /**
     * 触发选中连线事件
     * @param selectedObject
     * @param moveToCenter
     */
    triggerSelectEdge(selectedObject, moveToCenter) {
        this.selectEdge.next({
            selectedObject: selectedObject,
            moveToCenter: moveToCenter});
    }

    /**
     * 当选中的节点变化时
     * @param options
     */
    triggerOnSelectionChange(options) {
        this.onSelectionChange.next(options);
    }

    // 更新Graph
    triggerUpdateGraph(options) {
        this.updateGraph.next(options);
    }
}
