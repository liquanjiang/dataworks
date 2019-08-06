import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfigmanageComponent } from './configmanage.component';
import { DsComponent } from './ds/ds.component';

const routes: Routes = [
    {
        path: '', component: ConfigmanageComponent,
        children: [
            { path: 'ds', component: DsComponent },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ConfigmanageRoutingModule {
}
