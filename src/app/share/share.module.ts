import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoContentComponent } from './no-content/no-content.component';
import { ApiService } from './api.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { LoginService } from './login.service';
import { AuthGuardService } from './auth-guard.service';
import { HttpClientModule } from '@angular/common/http';
import { PaginationComponent } from './common/components/pagination/pagination.component';
import { TimeselctorComponent } from './common/components/timeselector/timeselector.component';
import { PeriodsetterComponent } from './common/components/periodsetter/periodsetter.component';
import { ScanLogsComponent } from './common/components/scan-logs/scan-logs.component';
import { SimpleSelectComponent } from './common/components/simple-select/simple-select.component';
import { GraphComponent } from './common/components/graph/graph.component';
import { CodeAreaComponent } from './common/components/code-area/code-area.component';
import { RelationShipComponent } from './common/components/relation-ship/relation-ship.component';
import { ColumnDetailComponent } from './common/components/column-detail/column-detail.component';
import { DataDetailsComponent } from './common/components/data-details/data-details.component';
import { NgYydatafinTableModule } from 'ng-yydatafin/table';
import { NgYydatafinPaginationModule } from 'ng-yydatafin';
import { NewSchSettingComponent } from './common/components/new-sch-setting/new-sch-setting.component';
import { EditSchSettingComponent } from './common/components/edit-sch-setting/edit-sch-setting.component';
import { AddNewRelationComponent } from './common/components/add-new-relation/add-new-relation.component';
import { SearchSingleSelectComponent } from './common/components/search-single-select/search-single-select.component';

@NgModule({
    imports: [
        CommonModule, FormsModule, RouterModule, HttpModule, HttpClientModule,
        NgYydatafinTableModule,
        NgYydatafinPaginationModule
    ],
    declarations: [NoContentComponent, PaginationComponent, TimeselctorComponent,
        PeriodsetterComponent, ScanLogsComponent, SimpleSelectComponent, GraphComponent,
        CodeAreaComponent, RelationShipComponent, ColumnDetailComponent, DataDetailsComponent,
        NewSchSettingComponent, EditSchSettingComponent, AddNewRelationComponent,
        SearchSingleSelectComponent],
    exports: [CommonModule, NoContentComponent, PaginationComponent, TimeselctorComponent,
        RelationShipComponent, ColumnDetailComponent, PeriodsetterComponent, DataDetailsComponent,
        ScanLogsComponent, SimpleSelectComponent, GraphComponent, CodeAreaComponent,
        NewSchSettingComponent, EditSchSettingComponent, AddNewRelationComponent,
        SearchSingleSelectComponent],
    providers: [LoginService, ApiService, AuthGuardService]
})
export class ShareModule {
}
