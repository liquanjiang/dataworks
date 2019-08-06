import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompositiveRoutingModule } from './compositive-routing.module';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { ShareModule } from '../../share/share.module';
import { NgYydatafinTreeModule } from 'ng-yydatafin/tree';
import { NgYydatafinTableModule } from 'ng-yydatafin/table';
import { NgYydatafinPaginationModule } from 'ng-yydatafin/pagination';
import { CompositiveComponent } from './compositive.component';
import { JobManageComponent } from './job-manage/job-manage.component';
import { SchedulMonitorComponent } from './schedul-monitor/schedul-monitor.component';
import { JobTreeComponent } from './job-manage/job-tree/job-tree.component';
import { WorkManageComponent } from './work-manage/work-manage.component';
import { WorkTreeComponent } from './work-manage/work-tree/work-tree.component';
import { SchedulHistoryComponent } from './schedul-monitor/schedul-history/schedul-history.component';
// import { GraphComponent } from './job-manage/stream-sets/graph/graph.component';
import { DetailComponent } from './job-manage/stream-sets/detail/detail.component';
import { StageLibraryComponent } from './job-manage/stream-sets/stage-library/stage-library.component';
// import { PipelineGraphComponent } from './job-manage/graph/pipeline-graph/pipeline-graph.component';
import { InfoComponent } from './job-manage/stream-sets/detail/info/info.component';
import { TaskListComponent } from './work-manage/task-list/task-list.component';
import { WorkSchesettingComponent } from './work-manage/work-schesetting/work-schesetting.component';
import { WorkSchehistoryComponent } from './work-manage/work-schehistory/work-schehistory.component';
import { TaskTreeComponent } from './work-manage/task-tree/task-tree.component';
import { ConfigurationComponent } from './job-manage/stream-sets/detail/configuration/configuration.component';
import { StreamSetsComponent } from './job-manage/stream-sets/stream-sets.component';


@NgModule({
    imports: [
        CommonModule, FormsModule, RouterModule, HttpModule, ShareModule, CompositiveRoutingModule,
        NgYydatafinTreeModule.forRoot(),
        NgYydatafinTableModule,
        NgYydatafinPaginationModule
    ],
    declarations: [CompositiveComponent, JobManageComponent,
        SchedulMonitorComponent, JobTreeComponent,
        WorkManageComponent, WorkTreeComponent, SchedulHistoryComponent,
        DetailComponent, StageLibraryComponent, InfoComponent,
        TaskListComponent, WorkSchesettingComponent,
        WorkSchehistoryComponent, TaskTreeComponent,
        ConfigurationComponent, StreamSetsComponent]
})
export class CompositiveModule {
}
