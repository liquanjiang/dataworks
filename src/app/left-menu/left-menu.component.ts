import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Util from '../share/common/util';

@Component({
    selector: 'app-left-menu',
    templateUrl: './left-menu.component.html',
    styleUrls: ['./left-menu.component.css']
})
export class LeftMenuComponent implements OnInit {
    @Input() parentMenuName: string;
    @Input() leftMenus: any[];
    @Input() menuSelectedCode: string;

    constructor(private router: Router, private route: ActivatedRoute) {
    }

    ngOnInit() {
    }

    selThisMenu(item: any) {
        this.menuSelectedCode = item.menuCode;
        this.router.navigate([item.url]);
    }

    getFontClassByMenu(iconUrl) {
        return Util.getIconClass(iconUrl);
    }
}
