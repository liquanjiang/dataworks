import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { DataworksRoutingModule } from './dataworks.routes';
import { DataworksComponent } from './dataworks.component';
import { ShareModule } from './share/share.module';
import { LoginComponent } from './login/login.component';
import { RouterModule } from '@angular/router';
import { AuthGuardService } from './share/auth-guard.service';
import { CookieService } from 'ngx-cookie-service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
    declarations: [ // 声明模块中拥有的视图类。Angular 有三种视图类：组件、指令和管道。
        DataworksComponent,
        LoginComponent
    ],
    imports: [ // 模块声明的组件模板需要的类所在的其它模块。
        BrowserModule, FormsModule, RouterModule, HttpModule, ShareModule, DataworksRoutingModule, HttpClientModule
    ],
    exports: [LoginComponent, ], // declarations 的子集，可用于其它模块的组件模板
    providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy },
        AuthGuardService, CookieService], //  服务的创建者，并加入到全局服务列表中，可用于应用任何部分。
    bootstrap: [DataworksComponent] // 指定应用的主视图（根组件），是所有其它视图的宿主。只有根模块才能设置bootstrap属性。
})
export class DataworksModule {
}
