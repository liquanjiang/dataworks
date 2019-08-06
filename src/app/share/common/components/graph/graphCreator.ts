import pipelineConstant from '../../../stream-sets/pipelineConstant';
// define graphcreator object
export class GraphCreator {
    consts =  {
        selectedClass: 'selected',
        connectClass: 'connect-node',
        rectGClass: 'rectangleG',
        pathGClass: 'pathG',
        graphClass: 'graph',
        startNodeClass: 'startNode',
        endNodeClass: 'endNode',
        BACKSPACE_KEY: 8,
        DELETE_KEY: 46,
        ENTER_KEY: 13,
        COMMAND_KEY: 91,
        CTRL_KEY: 17,
        COPY_KEY: 67,
        PASTE_KEY: 86,
        nodeRadius: 70,
        rectWidth: 120,
        rectHeight: 80,
        rectRound: 8
    };
    state: any = {
        selectedNode: null,
        selectedEdge: null,
        mouseDownNode: null,
        mouseDownNodeLane: null,
        mouseDownNodeEventLane: null,
        mouseDownLink: null,
        justDragged: false,
        justScaleTransGraph: false,
        lastKeyDown: -1,
        shiftNodeDrag: false,
        selectedText: null,
        currentScale: 1,
        copiedStage: undefined,
        showBadRecords: false,
        showConfiguration: false
    };

    idct;
    isReadOnly;
    $element;
    // 节点
    nodes;
    // 连线
    edges;
    // 错误警告
    issues;
    // svg容器
    svg;
    // svg中的g元素，绘制根元素
    svgG;
    dragLine;
    paths;
    rects;
    // drag操作
    drag;
    // zoom操作
    zoom;
    graphWarning;
    showTransition = false;
    copiedStage;
    onRemoveNodeSelection;
    onDeleteSelected;
    onPasteNode;
    onNodeSelection;
    onEdgeSelection;
    constructor(element, nodes, edges) {
        const graphContainer = d3.select(element);
        this.svg = graphContainer.select('svg');
        this.graphWarning = graphContainer.select('.warning-toolbar');
        this.idct = 0;
        this.nodes = nodes || [];
        this.edges = edges || [];

        // define arrow markers for graph links

        const markerWidth = 3.5;
        const markerHeight = 3.5;
        const cRadius = -7;
        // play with the cRadius value
        const refX = cRadius + (markerWidth * 2);
        const defs = this.svg.append('svg:defs');

        defs.append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', refX)
            .attr('markerWidth', markerWidth)
            .attr('markerHeight', markerHeight)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        // 选中的箭头
        defs.append('svg:marker')
            .attr('id', 'select-end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', refX)
            .attr('markerWidth', markerWidth)
            .attr('markerHeight', markerHeight)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        // Background lines
        const margin = {top: -5, right: -5, bottom: -5, left: -5};
        let svgWidth = 2500;
        let svgHeight = 2500;
        if (this.svg.length && this.svg[0] && this.svg[0].length) {
            const clientWidth = this.svg[0][0].clientWidth;
            const clientHeight = this.svg[0][0].clientHeight;

            if (clientWidth > svgWidth) {
                svgWidth = clientWidth;
            }

            if (clientHeight > svgHeight) {
                svgHeight = clientHeight;
            }
        }
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;
        const container = this.svg.append('g');
        // 画竖线
        container.append('g')
            .attr('class', 'x axis')
            .selectAll('line')
            .data(d3.range(0, width, 10))
            .enter().append('line')
            .attr('x1', function(d) { return d; })
            .attr('y1', 0)
            .attr('x2', function(d) { return d; })
            .attr('y2', height);
        // 画横线
        container.append('g')
            .attr('class', 'y axis')
            .selectAll('line')
            .data(d3.range(0, height, 10))
            .enter().append('line')
            .attr('x1', 0)
            .attr('y1', function(d) { return d; })
            .attr('x2', width)
            .attr('y2', function(d) { return d; });

        this.svgG = this.svg.append('g')
            .classed(this.consts.graphClass, true);
        const svgG = this.svgG;

        // displayed when dragging between nodes
        this.dragLine = svgG.append('svg:path')
            .attr('class', 'link dragline hidden')
            .attr('d', 'M0,0L0,0')
            .style('marker-end', 'url(#mark-end-arrow)');

        // svg nodes and edges
        this.paths = svgG.append('g').selectAll('g');
        this.rects = svgG.append('g').selectAll('g');


        this.drag = d3.behavior.drag()
            .origin((d) => {
                return {x: d[0], y: d[1]};
            })
            .on('drag', (args) => {
                // dragging
                this.state.justDragged = true;
                this.dragmove(args);
            })
            .on('dragend', function() {
                // todo check if edge-mode is selected
            });

        // listen for key events
        this.svg.on('keydown', () => {
                this.svgKeyDown();
            })
            .on('keyup', () => {
                this.svgKeyUp();
            })
            .on('mousedown', (d) => {
                this.svgMouseDown(d);
            })
            .on('mouseup', (d) => {
                this.svgMouseUp(d);
            });

        // listen for dragging

        this.zoom = d3.behavior.zoom()
            .scaleExtent([0.1, 2])
            .on('zoom', () => {
                if (d3.event && d3.event.sourceEvent && d3.event.sourceEvent.shiftKey) {
                    // TODO  the internal d3 state is still changing
                    return false;
                } else {
                    this.zoomed.call(this);
                }
                return true;
            })
            .on('zoomstart', function() {
                if (d3.event && d3.event.sourceEvent && !d3.event.sourceEvent.shiftKey) {
                    d3.select('body').style('cursor', 'move');
                }
            })
            .on('zoomend', function() {
                d3.select('body').style('cursor', 'auto');
            });

        this.svg.call(this.zoom)
            .on('dblclick.zoom', null);

        // svg.on('mousedown.zoom', null);
        // svg.on('mousemove.zoom', null);

        // To disable zoom on mouse scroll
        this.svg.on('dblclick.zoom', null);
        this.svg.on('touchstart.zoom', null);
        this.svg.on('wheel.zoom', null);
        this.svg.on('mousewheel.zoom', () => {
            if (d3.event && d3.event.wheelDelta) {
                if (d3.event.wheelDelta < 0) {
                    this.zoomOut();
                } else {
                    this.zoomIn();
                }
            }
        });
        this.svg.on('MozMousePixelScroll.zoom', null);
    }

    setIdCt(idct) {
        this.idct = idct;
    }

    /* PROTOTYPE FUNCTIONS */

    dragmove(d) {
        const thisGraph = this;
        if (this.state.shiftNodeDrag) {
            if (d.nodeType) { // 限制只能画一条
                thisGraph.paths.filter(function (temp) {
                    if (temp.sourceName === d.nodeName) {
                        for (let j = 0; j < thisGraph.edges.length; j++) {
                            if (temp.sourceName === thisGraph.edges[j].sourceName
                                && temp.assemblyName === thisGraph.edges[j].assemblyName) {
                                thisGraph.edges.splice(j, 1);
                                return true;
                            }
                        }
                    }
                });
            }
            const positions = d.position.split(',');
            const xPos = Number(positions[0]);
            const yPos = Number(positions[1]);
            const sourceX = (xPos + this.state.shiftNodeDragXPos);
            const sourceY = (yPos + this.state.shiftNodeDragYPos);
            const targetX = d3.mouse(thisGraph.svgG.node())[0];
            const targetY = d3.mouse(this.svgG.node())[1];
            const sourceTangentX = sourceX + (targetX - sourceX) / 2;
            const sourceTangentY = sourceY;
            const targetTangentX = targetX - (targetX - sourceX) / 2;
            const targetTangentY = targetY;

            thisGraph.dragLine.attr('d', 'M ' + sourceX + ',' + sourceY +
                'C' + sourceTangentX + ',' + sourceTangentY + ' ' +
                targetTangentX + ',' + targetTangentY + ' ' +
                targetX + ',' + targetY);
        } else {
            const positions = d.position.split(',');
            const xPos = Number(positions[0]);
            const yPos = Number(positions[1]);
            d.position = (xPos + d3.event.dx) + ',' + (yPos + d3.event.dy);
            thisGraph.updateGraph();
        }
    }

    deleteGraph() {
        const thisGraph = this;
        thisGraph.nodes = [];
        thisGraph.edges = [];
        this.state.selectedNode = null;
        this.state.selectedEdge = null;
        thisGraph.updateGraph();
    }

    /** select all text in element:
     * taken from http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element */
    selectElementContents(el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
    // 截取字符串 包含中文处理
    // (串,长度,增加...)
    subString(str, len) {
        let newLength = 0;
        let newStr = '';
        const chineseRegex = /[^\x00-\xff]/g;
        let singleChar = '';
        const strLength = str.replace(chineseRegex, '**').length;
        for (let i = 0; i < strLength; i++) {
            singleChar = str.charAt(i).toString();
            if (singleChar.match(chineseRegex) != null) {
                newLength += 2;
            } else {
                newLength++;
            }
            if (newLength > len) {
                break;
            }
            newStr += singleChar;
        }

        if (strLength > len) {
            newStr += '...';
        }
        return newStr;
    }

    /**
     * http://bl.ocks.org/mbostock/7555321
     *
     * @param gEl
     * @param title
     */
    insertTitleLinebreaks(gEl, title) {
        gEl.append('title').text(title);
        const el = gEl.append('text')
                .attr('text-anchor', 'middle')
                .attr('x', 50)
                .attr('y', 66),
            text = el,
            // words = title.split(/\s+/).reverse(),
            words = [title],
            lineHeight = 1.1, // ems
            y = text.attr('y'),
            dy = 0;
        let word,
            line = [],
            lineNumber = 0,
            tspan = text.text(null).append('tspan').attr('x', 60).attr('y', y).attr('dy', dy + 'em'),
            totalLines = 1;
        tspan.text(title);
        if (words.length === 1 && tspan.node().getComputedTextLength() > this.consts.rectWidth - 10) {
            tspan.text(this.subString(title, 16));
        } else {
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(' '));
                if (tspan.node().getComputedTextLength() > this.consts.rectWidth - 10) {
                    line.pop();
                    tspan.text(line.join(' ').substring(0, 23));

                    if (totalLines === 2) {
                        break;
                    }

                    line = [word];
                    tspan = text.append('tspan')
                        .attr('x', 60).attr('y', y)
                        .attr('dy', ++lineNumber * lineHeight + dy + 'em')
                        .text(word);
                    totalLines++;
                }
            }
        }

    }

    // remove edges associated with a node
    spliceLinksForNode(node) {
        const thisGraph = this,
            toSplice = thisGraph.edges.filter(function(l) {
                return (l.sourceName === node.nodeName
                    || l.assemblyName === node.nodeName
                    || l.sourceName === node.pk
                    || l.assemblyName === node.pk);
            });
        toSplice.map(function(l) {
            thisGraph.edges.splice(thisGraph.edges.indexOf(l), 1);
        });
    }

    replaceSelectEdge(d3Path, edgeData) {
        const thisGraph = this;
        if (this.state.selectedEdge) {
            thisGraph.removeSelectFromEdge();
        }
        d3Path.classed(thisGraph.consts.selectedClass, true);
        d3Path.select('path').style('marker-end', 'url(#select-end-arrow)');
        this.state.selectedEdge = edgeData;
    }

    replaceSelectNode(d3Node, nodeData) {
        const thisGraph = this;
        if (this.state.selectedNode) {
            thisGraph.removeSelectFromNode();
        }
        d3Node.classed(this.consts.selectedClass, true);
        d3Node.select('image')
            .attr('xlink:href', function(d) {
                let image = '';
                if (d.nodeType) {
                    image = 'dwb/resources/task/icon/' + d.pk.replace(/^\s+|\s+$/g, '');
                } else {
                    image = 'dataworks/assets/share/img/task';
                }
                return image + '-1.svg';
            })
            .on('error', function (d) {
                let image = '';
                switch (d.nodeType) {
                    case pipelineConstant.SOURCE_STAGE_TYPE:
                        image = 'dataworks/assets/stage/defaultSource.svg';
                        break;
                    case pipelineConstant.PROCESSOR_STAGE_TYPE:
                        image = 'dataworks/assets/stage/defaultProcessor.svg';
                        break;
                    case pipelineConstant.TARGET_STAGE_TYPE:
                        image = 'dataworks/assets/stage/defaultTarget.svg';
                        break;
                }
                d3.select(this).attr('xlink:href', image);
            });
        this.state.selectedNode = nodeData;
    }

    removeSelectFromNode() {
        const thisGraph = this;
        thisGraph.rects.filter((cd) => {
            return cd.nodeName === this.state.selectedNode.nodeName;
        }).classed(thisGraph.consts.selectedClass, false)
            .select('image')
            .attr('xlink:href', function(d) {
                let image = '';
                if (d.nodeType) {
                    image = 'dwb/resources/task/icon/' + d.pk.replace(/^\s+|\s+$/g, '');
                } else {
                    image = 'dataworks/assets/share/img/task';
                }
                return image + '-0.svg';
            })
            .on('error', function (d) {
                let image = '';
                switch (d.nodeType) {
                    case pipelineConstant.SOURCE_STAGE_TYPE:
                        image = 'dataworks/assets/stage/defaultSource.svg';
                        break;
                    case pipelineConstant.PROCESSOR_STAGE_TYPE:
                        image = 'dataworks/assets/stage/defaultProcessor.svg';
                        break;
                    case pipelineConstant.TARGET_STAGE_TYPE:
                        image = 'dataworks/assets/stage/defaultTarget.svg';
                        break;
                }
                d3.select(this).attr('xlink:href', image);
            });
        this.state.selectedNode = null;
    }

    removeSelectFromEdge() {
        const thisGraph = this;
        thisGraph.paths.filter((cd) => {
            return cd === this.state.selectedEdge;
        }).classed(thisGraph.consts.selectedClass, false)
            .select('path')
            .style('marker-end', 'url(#end-arrow)');
        this.state.selectedEdge = null;
    }

    pathMouseDown(d3path, d) {
        const thisGraph = this,
            state = this.state;
        d3.event.stopPropagation();
        state.mouseDownLink = d;

        if (state.selectedNode) {
            thisGraph.removeSelectFromNode();
        }

        const prevEdge = state.selectedEdge;
        if (!prevEdge || prevEdge !== d) {
            thisGraph.replaceSelectEdge(d3path, d);
        }
    }

    // mousedown on node
    stageMouseDown(d3node, d) {
        const thisGraph = this,
            state = this.state;
        d3.event.stopPropagation();
        state.mouseDownNode = d;
        if (state.shiftNodeDrag) {
            // reposition dragged directed edge
            const positions = d.position.split(',');
            const xPos = Number(positions[0]);
            const yPos = Number(positions[1]);
            thisGraph.dragLine.classed('hidden', false)
                .attr('d', 'M' + xPos + ',' + yPos + 'L' + xPos + ',' + yPos);
        }
    }

    // mouseup on nodes
    stageMouseUp(d3node, d) {
        const thisGraph = this,
            state = this.state,
            consts = thisGraph.consts;
        // reset the states
        state.shiftNodeDrag = false;
        d3node.classed(consts.connectClass, false);

        const mouseDownNode = state.mouseDownNode;
        const mouseDownNodeLane = state.mouseDownNodeLane;
        const mouseDownNodeEventLane = state.mouseDownNodeEventLane;

        if (!mouseDownNode) {
            return;
        }

        thisGraph.dragLine.classed('hidden', true);

        if (mouseDownNode.nodeName && mouseDownNode.nodeName !== d.nodeName &&
            d.nodeType !== pipelineConstant.SOURCE_STAGE_TYPE && !thisGraph.isReadOnly) {
            // we're in a different node: create new edge for mousedown edge and add to graph
            const newEdge: any = {
                sourceName: mouseDownNode.nodeType ? mouseDownNode.nodeName : mouseDownNode.pk,
                assemblyName: d.nodeType ? d.nodeName : d.pk
            };

            const filtRes = thisGraph.paths.filter(function(temp) {
                return temp.sourceName === newEdge.sourceName &&
                    temp.assemblyName === newEdge.assemblyName;
            });
            if (!filtRes[0].length) {
                thisGraph.edges.push(newEdge);
                thisGraph.updateGraph();
            }
        } else {
            state.justDragged = false;
            if (state.selectedEdge) {
                thisGraph.removeSelectFromEdge();
            }
            const prevNode = state.selectedNode;

            if (!prevNode || prevNode.nodeName !== d.nodeName) {
                thisGraph.replaceSelectNode(d3node, d);
            }
        }
        state.mouseDownNode = null;
        state.mouseDownNodeLane = null;
        state.mouseDownNodeEventLane = null;
    } // end of rects mouseup

    // mousedown on main svg
    svgMouseDown(d) {
        this.state.graphMouseDown = true;
    }

    // mouseup on main svg
    svgMouseUp(d) {
       const state = this.state;
        if (state.justScaleTransGraph) {
            // dragged not clicked
            state.justScaleTransGraph = false;
        } else if (state.shiftNodeDrag) {
            // dragged from node
            state.shiftNodeDrag = false;
            this.dragLine.classed('hidden', true);
        } else if (this.state.graphMouseDown) {
            if (this.state.selectedNode) {
                this.removeSelectFromNode();
            } else if (this.state.selectedEdge) {
                this.removeSelectFromEdge();
            }
            if (this.onRemoveNodeSelection) {
                this.onRemoveNodeSelection({
                    selectedObject: undefined,
                    type: pipelineConstant.PIPELINE
                });
            }

        }
        state.graphMouseDown = false;
    }

    // keydown on main svg
    svgKeyDown() {
        const thisGraph = this,
            state = this.state,
            consts = thisGraph.consts;

        // make sure repeated key presses don't register for each keydown
        if (state.lastKeyDown !== -1 && state.lastKeyDown !== consts.COMMAND_KEY &&
            state.lastKeyDown !== consts.CTRL_KEY) {
            return;
        }

        state.lastKeyDown = d3.event.keyCode;
        const selectedNode = state.selectedNode,
            selectedEdge = state.selectedEdge;

        switch (d3.event.keyCode) {
            case consts.BACKSPACE_KEY:
            case consts.DELETE_KEY:
                d3.event.preventDefault();
                if (this.onDeleteSelected) {
                    this.onDeleteSelected();
                }
                break;

            case consts.COPY_KEY:
                if ((d3.event.metaKey || d3.event.ctrlKey) && selectedNode) {
                    // $rootScope.common.copiedStage = selectedNode;
                    this.copiedStage = selectedNode;
                }
                break;


            case consts.PASTE_KEY:
                if (this.isReadOnly) {
                    return;
                }
                if ((d3.event.metaKey || d3.event.ctrlKey) && this.copiedStage) {
                    // $scope.$apply(function() {
                    //     $scope.$emit('onPasteNode', $rootScope.common.copiedStage);
                    // });
                    if (this.onPasteNode) {
                        this.onPasteNode(this.copiedStage);
                    }
                }
                break;
        }
    }

    svgKeyUp() {
        this.state.lastKeyDown = -1;
    }

    addNode(node, relativeX, relativeY) {
        const thisGraph = this;
        if (relativeX && relativeY) {
            const currentTranslatePos = thisGraph.zoom.translate(),
                startX = (currentTranslatePos[0]),
                startY = (currentTranslatePos[1]),
                xPos = (relativeX - startX) / this.state.currentScale,
                yPos = (relativeY - startY) / this.state.currentScale;
            node.position = xPos + ',' + yPos;
        }
        thisGraph.nodes.push(node);
        thisGraph.updateGraph();
        thisGraph.selectNode(node);
        thisGraph.moveNodeToVisibleArea(node);
    }

    deleteNode() {
        const selectNode = this.state.selectedNode;
        const seletEdge = this.state.selectedEdge;
        if (!selectNode && !seletEdge) {
            this.deleteGraph();
        } else {
            for (let i = 0; i < this.nodes.length; i++) {
                if (selectNode) {
                    if (this.nodes[i].nodeName === selectNode.nodeName) {
                       for (let j = 0; j < this.edges.length; j++) {
                           if (this.edges[j].sourceName === selectNode.nodeName
                               || this.edges[j].assemblyName === selectNode.nodeName
                               || this.edges[j].sourceName === selectNode.pk
                               || this.edges[j].assemblyName === selectNode.pk) {
                               this.edges.splice(j, 1);
                               j--;
                           }
                       }
                        this.nodes.splice(i, 1);
                        this.removeSelectFromNode();
                        this.updateGraph();
                    }
                } else if (seletEdge) {
                    for (let j = 0; j < this.edges.length; j++) {
                        if ((this.edges[j].sourceName === seletEdge.sourceName
                            && this.edges[j].assemblyName === seletEdge.assemblyName)
                            || (this.edges[j].sourceName === seletEdge.pk
                                && this.edges[j].assemblyName === seletEdge.pk)) {
                            this.edges.splice(j, 1);
                            this.removeSelectFromEdge();
                            this.updateGraph();
                        }
                    }
                }
            }
        }
    }


    selectNode(node) {
        let nodeExists;
        const addedNode = this.rects.filter(function(cd) {
            if (cd.nodeName === node.nodeName) {
                nodeExists = true;
            }
            return cd.nodeName === node.nodeName;
        });

        if (nodeExists) {
            this.replaceSelectNode(addedNode, node);
        }
    }

    selectEdge(edge) {
        let edgeExists;
        const addedEdge = this.paths.filter(function(d) {
            if (d.source.instanceName === edge.source.instanceName &&
                d.target.instanceName === edge.target.instanceName) {
                edgeExists = true;
                return true;
            }
            return false;
        });

        if (edgeExists) {
            this.replaceSelectEdge(addedEdge, edge);
        }
    }

    // call to propagate changes to graph
    updateGraph() {
        const thisGraph = this;
        const consts = this.consts;
        const state = this.state;

        this.paths = this.paths.data(this.edges, function(d) {
            return String(d.sourceName) + '+' + String(d.assemblyName);
        });

        // update existing nodes
        this.rects = this.rects.data(this.nodes, function(d) {
            return d.nodeName;
        });
        this.rects.attr('transform', function(d) {
            const positions = d.position.split(',');
            const xPos = Number(positions[0]);
            const yPos = Number(positions[1]);
            return 'translate(' + (xPos) + ',' + (yPos) + ')';
        });

        // add new nodes
        const newGs = this.rects.enter()
            .append('g');

        newGs.classed(consts.rectGClass, true)
            .attr('transform', function(d) {
                const positions = d.position.split(',');
                const xPos = Number(positions[0]);
                const yPos = Number(positions[1]);
                return 'translate(' + (xPos) + ',' + (yPos) + ')';
            })
            .on('mouseover', function(d) {
                if (state.shiftNodeDrag) {
                    d3.select(this).classed(consts.connectClass, true);
                }
            })
            .on('mouseout', function(d) {
                d3.select(this).classed(consts.connectClass, false);
            })
            .on('mousedown', (d) => {
                this.stageMouseDown.call(this, d3.select(this), d);

                const options: any = {
                    selectedObject: d,
                    type: pipelineConstant.STAGE_INSTANCE
                };
                if (this.onNodeSelection) {
                   this.onNodeSelection(options);
                }
            })
            .on('mouseup', function(d) {
                thisGraph.stageMouseUp.call(thisGraph, d3.select(this), d);
            })
            .call(this.drag);

        newGs.append('rect')
            .attr({
                'height': this.consts.rectHeight,
                'width': this.consts.rectWidth,
                'rx': this.consts.rectRound,
                'ry': this.consts.rectRound
            });

        // Input Connectors
        newGs.append('circle')
            .filter(function(d) {
                return !d.nodeType || d.nodeType !== pipelineConstant.SOURCE_STAGE_TYPE;
            })
            .attr({
                'cx': 0,
                'cy': consts.rectHeight / 2,
                'r': 8
            });

        // Output Connectors
        newGs.each(function(d) {
            const stageNode = d3.select(this);

            // Output Connectors
            if (!d.nodeType || d.nodeType !== pipelineConstant.TARGET_STAGE_TYPE) {
                const y = Math.round(consts.rectHeight / 2);
                stageNode
                    .append('circle')
                    .attr({
                        'cx': consts.rectWidth,
                        'cy': y,
                        'r': 8,
                        'class': '',
                        'title': ''
                    }).on('mousedown', function() {
                    thisGraph.state.shiftNodeDrag = true;
                    thisGraph.state.shiftNodeDragXPos = thisGraph.consts.rectWidth;
                    thisGraph.state.shiftNodeDragYPos = y;
                    // thisGraph.state.mouseDownNodeLane = lane;
                });
            }

            thisGraph.insertTitleLinebreaks(stageNode, d.nodeName);
        });

        // Add Stage icons
        newGs.append('svg:image')
            .attr('class', 'node-icon')
            .attr('x', (consts.rectWidth - 32) / 2)
            .attr('y', 10)
            .attr('width', 32)
            .attr('height', 32)
            .attr('xlink:href', function(d) {
                let image = '';
                if (d.nodeType) {
                    image = 'dwb/resources/task/icon/' + d.pk.replace(/^\s+|\s+$/g, '');
                } else {
                    image = 'dataworks/assets/share/img/task';
                }
                return image + '-0.svg';
            })
            .on('error', function (d) {
                let image = '';
                switch (d.nodeType) {
                    case pipelineConstant.SOURCE_STAGE_TYPE:
                        image = 'dataworks/assets/stage/defaultSource.svg';
                        break;
                    case pipelineConstant.PROCESSOR_STAGE_TYPE:
                        image = 'dataworks/assets/stage/defaultProcessor.svg';
                        break;
                    case pipelineConstant.TARGET_STAGE_TYPE:
                        image = 'dataworks/assets/stage/defaultTarget.svg';
                        break;
                }
                d3.select(this).attr('xlink:href', image);
            });

        // remove old nodes
        this.rects.exit().remove();

        const paths = this.paths;

        // update existing paths
        paths.selectAll('path')
            .style('marker-end', 'url(#end-arrow)')
            .classed(consts.selectedClass, function(d) {
                return d === state.selectedEdge;
            })
            .attr('d', (d) => {
                return this.getPathDValue(d);
            });

        const pathNewGs = paths.enter()
            .append('g');

        pathNewGs
            .classed(consts.pathGClass, true)
            .on('mousedown', function(d) {
                thisGraph.pathMouseDown.call(thisGraph, d3.select(this), d);
                if (thisGraph.onEdgeSelection) {
                    thisGraph.onEdgeSelection(d);
                }
            })
            .on('mouseup', function(d) {
                state.mouseDownLink = null;
            });

        // add new paths
        pathNewGs
            .append('path')
            .style('marker-end', 'url(#end-arrow)')
            .classed('link', true)
            .attr('d', function(d) {
                return thisGraph.getPathDValue(d);
            });

        // remove old links
        paths.exit().remove();
    }

    // 重命名
    renameNode (nodeName) {
        const thisGraph = this;
        // update existing nodes
        const rects = this.rects.filter(function(d) {
            return d.nodeName === nodeName;
        });
        rects.select('text').remove();
        rects.select('title').remove();
        // Output Connectors
        rects.each(function(d) {
            const stageNode = d3.select(this);
            thisGraph.insertTitleLinebreaks(stageNode, nodeName);
        });
    }

    getNodesByName(name) {
        const filterNode = this.nodes.filter(node => {
            return node.nodeName === name || node.pk === name;
        });
        return filterNode[0];
    }

    getPathDValue(d) {
        const thisGraph = this;
        const consts = thisGraph.consts;
        const source  = this.getNodesByName(d.sourceName);
        const target = this.getNodesByName(d.assemblyName);
        let sourceX;
        let sourceY;
        let targetX;
        let targetY;
        let sourceTangentX;
        let sourceTangentY;
        let targetTangentX;
        let targetTangentY;
        const y = Math.round(consts.rectHeight / 2);
        const source_xPos = Number(source.position.split(',')[0]);
        const source_yPos = Number(source.position.split(',')[1]);
        sourceX = (source_xPos + consts.rectWidth);
        sourceY = (source_yPos + y);

        const target_xPos = Number(target.position.split(',')[0]);
        const target_yPos = Number(target.position.split(',')[1]);
        if (target_xPos > (sourceX + 16)) {
            targetX = (target_xPos - 16);
        } else if (target_xPos > sourceX) {
            targetX = (target_xPos + 10);
        } else {
            targetX = (target_xPos + 16);
        }
        targetY = (target_yPos + consts.rectWidth / 2 - 20);

        sourceTangentX = sourceX + (targetX - sourceX) / 2;
        sourceTangentY = sourceY;
        targetTangentX = targetX - (targetX - sourceX) / 2;
        targetTangentY = targetY;

        return 'M ' + sourceX + ',' + sourceY +
            'C' + sourceTangentX + ',' + sourceTangentY + ' ' +
            targetTangentX + ',' + targetTangentY + ' ' +
            targetX + ',' + targetY;
    }

    zoomed() {
        this.state.justScaleTransGraph = true;

        if (this.showTransition) {
            this.showTransition = false;
            this.svgG
                .transition()
                .duration(750)
                .attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
        } else {
            this.svgG
                .attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
        }

    }

    zoomIn() {
        if (this.state.currentScale < this.zoom.scaleExtent()[1]) {
            this.state.currentScale = Math.round((this.state.currentScale + 0.1) * 10) / 10 ;
            this.zoom.scale(this.state.currentScale).event(this.svg);
        }
    }

    zoomOut() {
        if (this.state.currentScale > this.zoom.scaleExtent()[0]) {
            this.state.currentScale = Math.round((this.state.currentScale - 0.1) * 10) / 10 ;
            this.zoom.scale(this.state.currentScale).event(this.svg);
        }
    }

    panUp() {
        const translatePos = this.zoom.translate();
        translatePos[1] += 150;
        this.showTransition = true;
        this.zoom.translate(translatePos).event(this.svg);
    }

    panRight() {
        const translatePos = this.zoom.translate();
        translatePos[0] -= 250;
        this.showTransition = true;
        this.zoom.translate(translatePos).event(this.svg);
    }

    panHome(onlyZoomIn) {
        const thisGraph = this;
        const nodes = thisGraph.nodes;
        const consts = thisGraph.consts;
        const svgWidth = thisGraph.svg.style('width').replace('px', '');
        const svgHeight = thisGraph.svg.style('height').replace('px', '');
        let xScale;
        let yScale;
        let minX;
        let minY;
        let maxX;
        let maxY;
        let currentScale;

        if (!nodes || nodes.length < 1) {
            return;
        }

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const positions = node.position.split(',');
            const xPos = Number(positions[0]),
                yPos = Number(positions[1]);
            if (minX === undefined) {
                minX = xPos;
                maxX = xPos;
                minY = yPos;
                maxY = yPos;
            } else {
                if (xPos < minX) {
                    minX = xPos;
                }

                if (xPos > maxX) {
                    maxX = xPos;
                }

                if (yPos < minY) {
                    minY = yPos;
                }

                if (yPos > maxY) {
                    maxY = yPos;
                }
            }
        }

        xScale =  svgWidth / (maxX + consts.rectWidth + 30);
        yScale =  svgHeight / (maxY + consts.rectHeight + 30);

        this.showTransition = true;
        currentScale = xScale < yScale ? xScale : yScale;

        if (currentScale < 1 || !onlyZoomIn) {
            this.state.currentScale = currentScale;
            this.zoom.translate([0, 0]).scale(currentScale).event(this.svg);
        }
    }

    panLeft() {
        const translatePos = this.zoom.translate();
        translatePos[0] += 250;
        this.showTransition = true;
        this.zoom.translate(translatePos).event(this.svg);
    }

    panDown() {
        const translatePos = this.zoom.translate();
        translatePos[1] -= 150;
        this.showTransition = true;
        this.zoom.translate(translatePos).event(this.svg);
    }

    moveNodeToCenter(stageInstance) {
        const position = stageInstance.position.split(',');
        const xPos = Number(position[0]);
        const yPos = Number(position[1]);
        const thisGraph = this,
            consts = thisGraph.consts,
            svgWidth = thisGraph.svg.style('width').replace('px', ''),
            svgHeight = thisGraph.svg.style('height').replace('px', ''),
            currentScale = this.state.currentScale,
            x = svgWidth / 2 - (xPos + consts.rectWidth / 2) * currentScale,
            y = svgHeight / 2 - (yPos + consts.rectHeight / 2) * currentScale;

        this.showTransition = true;
        this.zoom.translate([x, y]).event(this.svg);
    }

    moveNodeToVisibleArea(stageInstance) {
        const position = stageInstance.position.split(',');
        const xPos = Number(position[0]);
        const yPos = Number(position[1]);
        const thisGraph = this,
            currentScale = this.state.currentScale,
            svgWidth = thisGraph.svg.style('width').replace('px', ''),
            svgHeight = thisGraph.svg.style('height').replace('px', ''),
            currentTranslatePos = this.zoom.translate(),
            startX = -(currentTranslatePos[0]),
            startY = -(currentTranslatePos[1]),
            endX = startX + parseInt(svgWidth, 10),
            endY = startY + parseInt(svgHeight, 20),
            nodeStartXPos = (xPos * currentScale),
            nodeStartYPos = (yPos * currentScale),
            nodeEndXPos = ((xPos + thisGraph.consts.rectWidth) * currentScale),
            nodeEndYPos = ((yPos + thisGraph.consts.rectHeight) * currentScale);

        if (parseInt(svgWidth, 10) > 0 && parseInt(svgHeight, 10) > 0 &&
            (nodeStartXPos < startX || nodeEndXPos > endX || nodeStartYPos < startY || nodeEndYPos > endY)) {
            thisGraph.moveNodeToCenter(stageInstance);
        }
    }

    moveGraphToCenter() {
        this.showTransition = true;
        this.zoom.translate([0, 0]).event(this.svg);
    }

    clearStartAndEndNode() {
        const thisGraph = this;
        thisGraph.rects.classed(thisGraph.consts.startNodeClass, false);
        thisGraph.rects.classed(thisGraph.consts.endNodeClass, false);
    }

    // addDirtyNodeClass() {
    //     this.rects.selectAll('circle')
    //         .attr('class', (d) => {
    //             const currentClass = d3.select(this).attr('class');
    //             if (currentClass) {
    //                 const currentClassArr = currentClass.split(' '),
    //                     intersection = _.intersection(this.dirtyLanes, currentClassArr);
    //
    //                 if (intersection && intersection.length) {
    //                     return currentClass + ' dirty';
    //                 }
    //             }
    //             return currentClass;
    //         });
    // }

    // clearDirtyNodeClass() {
    //     const thisGraph = this;
    //     thisGraph.rects.selectAll('circle')
    //         .attr('class', function() {
    //             let currentClass = d3.select(this).attr('class');
    //
    //             if (currentClass && currentClass.indexOf('dirty') !== -1) {
    //                 currentClass = currentClass.replace(/dirty/g, '');
    //             }
    //
    //             return currentClass;
    //         });
    // }

    updateStartAndEndNode(startNode, endNode) {
        const thisGraph = this;

        thisGraph.clearStartAndEndNode();

        if (startNode) {
            thisGraph.rects.filter(function(cd) {
                return cd.instanceName === startNode.instanceName;
            }).classed(thisGraph.consts.startNodeClass, true);
        }

        if (endNode) {
            thisGraph.rects.filter(function(cd) {
                return cd.instanceName === endNode.instanceName;
            }).classed(thisGraph.consts.endNodeClass, true);
        }

    }

}
