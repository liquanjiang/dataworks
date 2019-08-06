import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DqmanageComponent } from './dqmanage.component';
import { CheckResultComponent } from './check-result/check-result.component';
import { CheckDefComponent } from './check-def/check-def.component';
import { ChangeHistoryComponent } from './change-history/change-history.component';
import { OrderReportComponent } from './order-report/order-report.component';

const routes: Routes = [
    {
        path: '', component: DqmanageComponent,
        children: [
            { path: 'checkresult', component: CheckResultComponent },
            { path: 'checkdef', component: CheckDefComponent },
            { path: 'changehistory', component: ChangeHistoryComponent },
            { path: 'orderreport', component: OrderReportComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DqmanageRoutingModule {
}
