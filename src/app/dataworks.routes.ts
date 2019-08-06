/**
 * Created by LiQuanjiang on 2018/8/23 14:16.
 * Description:
 */
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { NoContentComponent } from './share/no-content/no-content.component';

export const ROUTES: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'dwb', loadChildren: './console/console.module#ConsoleModule' },
    { path: '**', component: NoContentComponent }
];

@NgModule({
    imports: [
        RouterModule.forRoot(ROUTES)
    ],
    exports: [
        RouterModule
    ]
})
export class DataworksRoutingModule {
}
