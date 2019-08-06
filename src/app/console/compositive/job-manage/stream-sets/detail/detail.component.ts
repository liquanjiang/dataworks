import { Component, EventEmitter, Input, OnInit, Output, OnChanges } from '@angular/core';
import pipelineConstant from '../../../../../share/stream-sets/pipelineConstant';
@Component({
  selector: 'app-streamsets-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class DetailComponent implements OnInit, OnChanges {

    // 是否正在运行
    @Input() isPipelineRunning;
    // 当前选中对象的类型
    @Input() selectedType;
    // 当前选中对象：节点或任务
    @Input() selectedObject;
    // 日志列表
    @Input() logList;
    // 所有节点，用来判断是否重名
    @Input() stageInstances;
    @Input() edges;
    // 当点击最大化按钮时执行此方法
    @Output() maxPanelClick: EventEmitter<any> = new EventEmitter<any>();
    // 当点击最小化按钮时执行此方法
    @Output() minPanelClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() updateGraph: EventEmitter<any> = new EventEmitter<any>();

    activeTab = 'info';
    detailPanelStatus = 'normal';
    nodeTypeMap = {
        'SOURCE': '源节点',
        'PROCESSOR': '处理节点',
        'TARGET': '目标节点'
    };
    constructor() { }

    ngOnInit() {
       if (this.isPipelineRunning) {
           this.activeTab = 'log';
       }
    }

    ngOnChanges(changes) {
        if (changes.selectedObject) {
            if (this.selectedType === 'PIPELINE') {
                this.activeTab = 'info';
            } else if (this.selectedType !== 'LINK') {
                this.activeTab = 'config';
            }
        }
        if (this.isPipelineRunning) {
            this.activeTab = 'log';
        }
    }

    /**
     * Returns label for Detail Pane
     */
    getDetailPaneLabel() {
        const selectedType = this.selectedType,
            selectedObject = this.selectedObject;

        if (selectedObject) {
            switch (selectedType) {
                case pipelineConstant.PIPELINE:
                    return selectedObject.info.name;
                case pipelineConstant.STAGE_INSTANCE:
                    return selectedObject.nodeName;
                case pipelineConstant.LINK:
                    return 'Stream ( ' + selectedObject.source.uiInfo.label + ' - ' + selectedObject.target.uiInfo.label + ' )';
            }
        }
    }

    /**
     * On Tab Select
     * @param tab
     */
    onTabSelect(tab) {
        this.activeTab = tab;
    }

    maxPanel() {
        if (this.detailPanelStatus === 'max') {
            this.detailPanelStatus = 'normal';
        } else {
            this.detailPanelStatus = 'max';
        }
        this.maxPanelClick.emit(this.detailPanelStatus);
    }

    minPanel() {
        if (this.detailPanelStatus === 'min') {
            this.detailPanelStatus = 'normal';
        } else {
            this.detailPanelStatus = 'min';
        }
        this.minPanelClick.emit(this.detailPanelStatus);
    }

    update(preName) {
        this.updateGraph.emit(preName);
    }

}
