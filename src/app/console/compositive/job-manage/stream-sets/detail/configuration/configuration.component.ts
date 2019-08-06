import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import { isArray } from 'util';
import { PipelineService } from '../../../../../../share/stream-sets/pipeline.service';
import Util from '../../../../../../share/common/util';
@Component({
  selector: 'app-streamsets-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class ConfigurationComponent implements OnInit, OnChanges {
    @Input() selectedObject;
    @Input() selectedType;
    @Input() stageInstances;
    @Input() edges;
    // isFocus = false;
    // isHover;
    @Output() updateGraph: EventEmitter<any> = new EventEmitter<any>();

    constructor() { }

    ngOnInit() {
    }
    ngOnChanges() {
        const nodeConfigs = this.selectedObject.nodeConfigs;
        if (nodeConfigs && nodeConfigs.length > 0) {
            for (let j = 0; j < nodeConfigs.length; j++) {
                if (nodeConfigs[j].configtype === 'mappingarray') {
                    if (nodeConfigs[j].value) {
                        if (!isArray(nodeConfigs[j].value)) {
                            nodeConfigs[j].value = _.entries(nodeConfigs[j].value);
                        }

                    } else {
                        nodeConfigs[j].value = [['' , '']];
                    }
                } else if (nodeConfigs[j].configtype === 'jsonarray') {
                    if (nodeConfigs[j].value.sysvarible
                        && Object.keys(nodeConfigs[j].value.sysvarible).length > 0) {
                        if (!isArray(nodeConfigs[j].value.sysvarible)) {
                            nodeConfigs[j].value.sysvarible = _.entries(nodeConfigs[j].value.sysvarible);
                        }

                    } else {
                        nodeConfigs[j].value.sysvarible = [['' , '']];
                    }
                }
            }
        }
    }

    deleteMapValue(configDefinition, i) {
        switch (configDefinition.configtype) {
            case 'mappingarray':
                configDefinition.value.splice(i, 1);
                break;
            case 'jsonarray':
                configDefinition.value.sysvarible.splice(i, 1);
                break;
            case 'tripletext1':
                configDefinition.value.param.splice(i, 1);
                break;
            case 'tripletext2':
                configDefinition.value.param.splice(i, 1);
                break;
        }
    }

    addMapValue(configDefinition) {
        switch (configDefinition.configtype) {
            case 'mappingarray':
                if (configDefinition.value) {
                    configDefinition.value.push(['', '']);
                } else {
                    configDefinition.value = [['', '']];
                }
                break;
            case 'jsonarray':
                if (configDefinition.value.sysvarible) {
                    configDefinition.value.sysvarible.push(['', '']);
                } else {
                    configDefinition.value.sysvarible = [['', '']];
                }
                break;
            case 'tripletext1':
                configDefinition.value.param.push({
                    oldcol: '',
                    newtype: '',
                    newcol: ''
                });
                break;
            case 'tripletext2':
                configDefinition.value.param.push({
                    coltype: '',
                    dealmethod: '',
                    fillvalue: null
                });
                break;
        }
    }

    update(e) {
        const nodeName = e.target.value;
        const preName = this.selectedObject.nodeName;
        const samples = this.stageInstances.filter((node) => {
            return node.nodeName === nodeName;
        });
        if (samples.length > 0) {
            Util.showMessage('任务名字重复', 'error');
            return;
        }
        for (let i = 0; i < this.edges.length; i++) {
            const link = this.edges[i];
            for (const key in link) {
                if (link[key] === preName) {
                    link[key] = nodeName;
                }
            }
        }
        this.selectedObject.nodeName =  nodeName;
        this.updateGraph.emit(nodeName);
    }
}
