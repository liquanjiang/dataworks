import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeftMenuComponent } from './left-menu.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { ShareModule } from '../share/share.module';

@NgModule({
    imports: [
        CommonModule, FormsModule, RouterModule, HttpModule, ShareModule
    ],
    declarations: [LeftMenuComponent],
    exports: [LeftMenuComponent]
})
export class LeftMenuModule {
}
