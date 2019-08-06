import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CompositiveComponent } from './compositive.component';
import { JobManageComponent } from './job-manage/job-manage.component';
import { SchedulMonitorComponent } from './schedul-monitor/schedul-monitor.component';
import { WorkManageComponent } from './work-manage/work-manage.component';

const routes: Routes = [
    {
        path: '', component: CompositiveComponent,
        children: [
            { path: 'jobmanage', component: JobManageComponent },
            { path: 'schdmonitor', component: SchedulMonitorComponent },
            { path: 'taskmanage', component: WorkManageComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CompositiveRoutingModule {
}
