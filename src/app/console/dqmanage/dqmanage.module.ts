import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DqmanageRoutingModule } from './dqmanage-routing.module';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { ShareModule } from '../../share/share.module';
import { DqmanageComponent } from './dqmanage.component';
import { CheckResultComponent } from './check-result/check-result.component';
import { CheckDefComponent } from './check-def/check-def.component';
import {TreemodelComponent} from './check-def/treemodel/treemodel.component'
import { ChangeHistoryComponent } from './change-history/change-history.component';
import { OrderReportComponent } from './order-report/order-report.component';
import { EchartsDetailsComponent } from './change-history/echarts-details/echarts-details.component';
import { NgYydatafinTreeModule} from 'ng-yydatafin/tree';
import { NgYydatafinTableModule } from 'ng-yydatafin/table';
import { NgYydatafinPaginationModule } from 'ng-yydatafin/pagination';
import { ResultTableComponent } from './check-result/result-table/result-table.component';
import { IssueRecordComponent } from './check-result/issue-record/issue-record.component';
import { ReportDetailComponent } from './order-report/report-detail/report-detail.component';

@NgModule({
    imports: [
        CommonModule, FormsModule, RouterModule, HttpModule, ShareModule, DqmanageRoutingModule,
        NgYydatafinTableModule, NgYydatafinPaginationModule, NgYydatafinTreeModule
    ],
    declarations: [DqmanageComponent, CheckResultComponent,
        CheckDefComponent, TreemodelComponent, ChangeHistoryComponent, OrderReportComponent,
        EchartsDetailsComponent, ResultTableComponent, IssueRecordComponent, ReportDetailComponent]
})

export class DqmanageModule {
}
