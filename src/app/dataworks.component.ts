import { AfterViewInit, Component } from '@angular/core';

declare var $: any;

@Component({
    selector: 'app-dataworks-root',
    template: '<router-outlet></router-outlet>'
})
export class DataworksComponent implements AfterViewInit {
    constructor() {
    }

    ngAfterViewInit() {
    }
}
