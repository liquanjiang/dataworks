import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { ApiService } from '../../../share/api.service';
import { JobTreeComponent } from './job-tree/job-tree.component';
import { StreamSetsComponent } from './stream-sets/stream-sets.component';

declare var $: any;

@Component({
    selector: 'app-job-manage',
    templateUrl: './job-manage.component.html',
    styleUrls: ['./job-manage.component.css']
})
export class JobManageComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(JobTreeComponent)
    private child: JobTreeComponent;
    @ViewChild('streamsets')
    private streamsets: StreamSetsComponent;
    showRightarea = true;
    pkTask;

    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {

    }


    ngAfterViewInit() {
    }

    ngOnDestroy() {
        $(window).off('click');
    }

    changeRootNode($event) {

    }

    // 重命名
    changeTreeNodeName($event) {
        this.streamsets.pipelineConfig.info.name = $event;
    }

    // 切换任务
    changeQuerydirPK($event) {
        // 不显示空白
        this.showRightarea = false;
        this.pkTask = $event;
    }

    // 是否显示右侧的空白提示
    changeTreeNode($event) {
        this.showRightarea = true;
    }

    // 新建任务
    newTreeFolder() {
        this.child.addJob();
    }

}
