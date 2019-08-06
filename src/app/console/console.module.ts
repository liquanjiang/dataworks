import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { ConsoleRoutingModule } from './console-routing.module';
import { ConsoleComponent } from './console.component';
import { HeaderComponent } from '../header/header.component';
import { LeftMenuComponent } from '../left-menu/left-menu.component';
import { LeftMenuModule } from '../left-menu/left-menu.module';
import { ShareModule } from '../share/share.module';
import { HeaderModule } from '../header/header.module';
import { MetamanageModule } from './metamanage/metamanage.module';
import { DqmanageModule } from './dqmanage/dqmanage.module';
import { CompositiveModule } from './compositive/compositive.module';
import { ConfigmanageModule } from './configmanage/configmanage.module';


@NgModule({
    imports: [
        CommonModule, FormsModule, RouterModule, HttpModule, ShareModule,
        HeaderModule,
        LeftMenuModule,
        ConsoleRoutingModule,
        MetamanageModule,
        DqmanageModule,
        CompositiveModule,
        ConfigmanageModule
    ],
    declarations: [ConsoleComponent],
    entryComponents: [HeaderComponent, LeftMenuComponent]
})
export class ConsoleModule {
}
