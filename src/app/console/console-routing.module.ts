import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConsoleComponent } from './console.component';
import { AuthGuardService } from '../share/auth-guard.service';

const routes: Routes = [
    {
        path: '',
        component: ConsoleComponent,
        canActivate: [AuthGuardService],
        canActivateChild: [AuthGuardService],
        children: [
            { path: 'metamanage', loadChildren: 'app/console/metamanage/metamanage.module#MetamanageModule' },
            { path: 'dqmanage', loadChildren: 'app/console/dqmanage/dqmanage.module#DqmanageModule' },
            { path: 'di', loadChildren: 'app/console/compositive/compositive.module#CompositiveModule' },
            { path: 'configmanage', loadChildren: 'app/console/configmanage/configmanage.module#ConfigmanageModule' }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ConsoleRoutingModule {
}
