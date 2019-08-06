import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonService } from '../../../stream-sets/common.service';
import { PipelineService } from '../../../stream-sets/pipeline.service';
import {GraphCreator} from './graphCreator';
import pipelineConstant from '../../../stream-sets/pipelineConstant';
@Component({
  selector: 'app-streamsets-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit, AfterViewInit, OnDestroy {

    // 节点或者任务选中触发
    @Output() onNodeSelection: EventEmitter<any> = new EventEmitter<any>();
    // 节点或者任务移除触发
    @Output() onRemoveNodeSelection: EventEmitter<any> = new EventEmitter<any>();
    // 当前图形的容器dom对象
    $element;
    // 图形实例
    graph;
    // 图形更新监听对象
    updateGraphSub;
    // 新增节点监听对象
    addNodeSub;
    // 删除节点监听对象
    deleteNodeSub;
    selectChangeSub;
    constructor( private commonService: CommonService,
                 private pipelineService: PipelineService) { }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.$element = document.getElementById('graph-container');
        this.updateGraphSub = this.pipelineService.updateGraph
            .subscribe((options: any) => {
                const nodes = options.nodes,
                    edges = options.edges,
                    selectNode = options.selectNode,
                    selectEdge = options.selectEdge;

                if (this.graph !== undefined) {
                    this.graph.deleteGraph();
                } else {
                    this.graph = new GraphCreator(this.$element, nodes, edges || []);
                    this.graph.setIdCt(2);
                }
                this.graph.nodes = nodes;
                this.graph.edges = edges;
                this.graph.isReadOnly = options.isReadOnly;
                this.graph.onRemoveNodeSelection = (e) => {
                    this.onRemoveNodeSelection.emit(e);
                };
                this.graph.onNodeSelection = (e) => {
                    this.onNodeSelection.emit(e);
                };
                this.graph.updateGraph();
                if (selectNode) {
                    this.graph.selectNode(selectNode);
                } else if (selectEdge) {
                    this.graph.selectEdge(selectEdge);
                }

                if (options.fitToBounds) {
                    this.graph.panHome();
                }
            });

        this.addNodeSub =  this.pipelineService.addNode.subscribe((options: any) => {
            this.graph.addNode(options.stageInstance, options.relativeXPos, options.relativeYPos);
            $(this.graph.svg[0]).focus();
        });

        this.deleteNodeSub = this.pipelineService.deleteNode.subscribe(() => {
            this.graph.deleteNode();
            $(this.graph.svg[0]).focus();
        });
        this.selectChangeSub = this.pipelineService.onSelectionChange.subscribe((options: any) => {
            if ( options.type === pipelineConstant.PIPELINE) {
                if (this.graph.state.selectedNode) {
                    this.graph.removeSelectFromNode();
                } else if (this.graph.state.selectedEdge) {
                    this.graph.removeSelectFromEdge();
                }

            }
        });
    }

    ngOnDestroy() {
        this.updateGraphSub.unsubscribe();
        this.addNodeSub.unsubscribe();
        this.deleteNodeSub.unsubscribe();
    }

    panHome($event) {
        this.graph.panHome();
        $event.preventDefault();
    }

    zoomIn($event) {
        this.graph.zoomIn();
        $event.preventDefault();
    }

    zoomOut($event) {
        this.graph.zoomOut();
        $event.preventDefault();
    }
}
