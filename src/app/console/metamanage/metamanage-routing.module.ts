import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MapComponent } from './map/map.component';
import { MetaComponent } from './meta/meta.component';
import { QueryComponent } from './query/query.component';
import { MetamanageComponent } from './metamanage.component';

const routes: Routes = [
    {
        path: '', component: MetamanageComponent,
        children: [
            { path: 'map', component: MapComponent },
            { path: 'collect', component: MetaComponent },
            { path: 'query', component: QueryComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MetamanageRoutingModule {
}
