import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigmanageRoutingModule } from './configmanage-routing.module';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { ShareModule } from '../../share/share.module';
import { ConfigmanageComponent } from './configmanage.component';
import { DsComponent } from './ds/ds.component';
import { NgYydatafinTableModule } from 'ng-yydatafin/table';
import { NgYydatafinPaginationModule } from 'ng-yydatafin/pagination';
@NgModule({
    imports: [
        CommonModule, FormsModule, RouterModule, HttpModule, ShareModule, ConfigmanageRoutingModule,
        NgYydatafinTableModule,
        NgYydatafinPaginationModule
    ],
    declarations: [ConfigmanageComponent, DsComponent]
})
export class ConfigmanageModule {
}
