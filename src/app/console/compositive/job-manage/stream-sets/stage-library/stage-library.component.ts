import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PipelineService } from '../../../../../share/stream-sets/pipeline.service';
import pipelineConstant from '../../../../../share/stream-sets/pipelineConstant';
import { StreamSetsService } from '../../../../../share/stream-sets/stream-sets.service';
import Util from '../../../../../share/common/util';
@Component({
  selector: 'app-streamsets-stage-library',
  templateUrl: './stage-library.component.html',
  styleUrls: ['./stage-library.component.css']
})
export class StageLibraryComponent implements OnInit {
    // 增加一个节点触发此事件
    @Output() addStageInstance: EventEmitter<any> = new EventEmitter<any>();
    pipelineConstant = pipelineConstant;
    // 所有节点列表
    stageLibraries;
    // 节点的分类
    stageFilterGroup = '';
    // 筛选出的节点列表
    filteredStageLibraries = [];
    // 搜索关键字
    searchInput = '';
    // 节点类型，下拉
    stageList = [
        {
            name: '全部类型',
            value: ''
        },
        {
            name: '源节点',
            value: pipelineConstant.SOURCE_STAGE_TYPE
        },
        {
            name: '处理节点',
            value: pipelineConstant.PROCESSOR_STAGE_TYPE
        },
        {
            name: '目标节点',
            value: pipelineConstant.TARGET_STAGE_TYPE
        }
    ];
    constructor(private pipelineService: PipelineService, private streamSetsService: StreamSetsService) { }

    ngOnInit() {
        this.streamSetsService.getStageLibarays().then(response => {
            if (response.code === 200) {
                this.stageLibraries = response.data;
                this.filteredStageLibraries = this.stageLibraries.SOURCE
                    .concat(this.stageLibraries.PROCESSOR)
                    .concat(this.stageLibraries.TARGET);
            } else {
                Util.showMessage('加载节点列表失败' + response.msg, 'error');
            }
        });
    }

    /**
     * 获取当前节点的图标url
     *
     * @param stage
     * @returns {*}
     */
    getStageIconURL(stage, error, $event) {
        // return 'url(' + this.pipelineService.getStageIconURL(stage, error) + ')';
        if (!error) {
            return this.pipelineService.getStageIconURL(stage, error);
        } else {
            const url = this.pipelineService.getStageIconURL(stage, error);
            $event.target.src = url;
        }
    }

    /**
     * 当节点分类切换时
     *
     */
    onStageFilterGroupChange() {
        let tempStageLibraries = this.stageLibraries.TARGET
            .concat(this.stageLibraries.PROCESSOR)
            .concat(this.stageLibraries.SOURCE);
        if (this.stageFilterGroup) {
            tempStageLibraries = this.stageLibraries[this.stageFilterGroup]
                ? this.stageLibraries[this.stageFilterGroup] : [];
        }
        if (tempStageLibraries.length > 0 && this.searchInput) {
            tempStageLibraries = tempStageLibraries.filter(stage => {
                const nodeName = stage.nodeName.toLowerCase();
                const inputValue = this.searchInput.toLowerCase();
                return !(nodeName.indexOf(inputValue) < 0);
            });
        }
        this.filteredStageLibraries = tempStageLibraries;
    }

    // 新增一个节点
    addStage (stageLibrary, event) {
        this.addStageInstance.emit({
            options: {stage: stageLibrary},
            $event: event
        });
    }

    // 节点开始拖拽
    addDragStart(e, stageLibrary) {
        e.dataTransfer.setData('text', JSON.stringify(stageLibrary));
    }

}
