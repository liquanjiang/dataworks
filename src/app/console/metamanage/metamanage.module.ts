import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './map/map.component';
import { MetaComponent } from './meta/meta.component';
import { QueryComponent } from './query/query.component';
import { MetamanageRoutingModule } from './metamanage-routing.module';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { ShareModule } from '../../share/share.module';
import { MetamanageComponent } from './metamanage.component';
import { TreemodelComponent } from './meta/treemodel/treemodel.component';
import { NgYydatafinTreeModule } from 'ng-yydatafin/tree';
import { DetailsComponent } from './query/details/details.component';
import { NgYydatafinTableModule } from 'ng-yydatafin/table';
import { MetaDetailsComponent } from './meta/meta-details/meta-details.component';
import { NgYydatafinPaginationModule } from 'ng-yydatafin/pagination';
import { ChildDetailsComponent } from './meta/meta-details/child-details/child-details.component';
import { ChildobjComponent } from './query/details/childobj/childobj.component';

@NgModule({
    imports: [
        CommonModule, FormsModule, RouterModule, HttpModule, ShareModule, MetamanageRoutingModule,
        NgYydatafinTreeModule.forRoot(),
        NgYydatafinTableModule,
        NgYydatafinPaginationModule
    ],
    declarations: [MetamanageComponent, MapComponent, MetaComponent, QueryComponent,
        TreemodelComponent, DetailsComponent, MetaDetailsComponent,
        ChildDetailsComponent, ChildobjComponent]
})
export class MetamanageModule {
}
