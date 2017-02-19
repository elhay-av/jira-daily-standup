///<reference path="../node_modules/@types/jquery/index.d.ts" />
const cssPrefix = (prefix='') => 'jd-' + prefix;
const quickFiltersSelector = '#js-work-quickfilters';
const activeFilterSelector = '.ghx-active';
let FILTER_DURATION = 30;

interface IClock {
    interval: number;
    duration: number;
    className: string;
    $container: JQuery;

    getContainer(): JQuery;
    start(): IClock;
    stop(): IClock;
    onChange(): void;
    onEnd(): void;
}

class Clock implements IClock {
    interval: number;
    duration: number;
    className: string;
    $container: JQuery;
    _onEnd: Function;

    constructor(duration: number, onEnd: any, className: string) {
        this._onEnd = onEnd;
        this.duration = duration;
        this.className = `${cssPrefix() + className}-clock`;
        this.$container = jQuery(`<div class="${this.className}">`);

        this.onEnd = this.onEnd.bind(this);
        this.start = this.start.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    getContainer(): JQuery {
        return this.$container;
    };

    start(): Clock {
        this.interval = setInterval(() => {
            this.duration--;

            if (this.duration < 0) {
                this.stop();
                this.onEnd();
                return;
            }

            this.onChange();
        }, 1000);
        return this;
    }

    stop(): Clock {
        clearInterval(this.interval);
        return this;
    }

    onEnd(): void {
        this._onEnd && this._onEnd();
    }

    onChange(): void {}
}

class DigitsClock extends Clock {
    $seconds: JQuery;
    $minutes: JQuery;

    constructor(duration: number, onEnd: any) {
        super(duration, onEnd, 'digits');

        this.$seconds = jQuery(`<span class="${cssPrefix()}clock-seconds">`);
        this.$minutes = jQuery(`<span class="${cssPrefix()}clock-minutes">`);

        this.$container
            .text(':')
            .prepend(this.$minutes)
            .append(this.$seconds);

        this.start();
    }

    static clockNumber(number: number): string {
        const stringNumber = number.toString();
        return number < 10? '0' + parseInt(stringNumber): parseInt(stringNumber).toString();
    }

    onChange(): void {
        this.$minutes.text(DigitsClock.clockNumber(this.duration/60));
        this.$seconds.text(DigitsClock.clockNumber(this.duration%60));
    }
}

class SandClock extends Clock {
    startDuration: number;

    constructor(duration: number, onEnd: any) {
        super(duration, onEnd, 'sand');

        this.startDuration = this.duration;

        this.start();
    }

    private getPercentage(): number {
        const number = (this.duration/this.startDuration) * 100;
        return parseInt(number.toString());
    }

    onChange(): void {
        this.$container.css({left: -this.getPercentage() + '%'});
    }
}

class Timer {
    static playClassName = `${cssPrefix()}play`;
    static timerClassName = `${cssPrefix()}timer`;

    className: string;
    $btn: JQuery;
    $timer: JQuery;
    state: boolean;

    _onEnd: Function;

    digitsClock: DigitsClock | Clock;
    sandClock: SandClock | Clock;

    constructor(onEnd: any) {
        this.setOnEnd(onEnd);
        this.className = `${cssPrefix()}play-pause-btn`;
        this.$btn = jQuery(`<div class="${this.className}">`);
        this.$timer = jQuery(`<div class="${Timer.timerClassName}">`);

        jQuery('body').prepend(this.$timer);

        this.toggleState = this.toggleState.bind(this);
        this.start = this.start.bind(this);

        this.$btn.on('click', this.toggleState);
    }

    getBtn() {
        return this.$btn;
    }

    toggleState() {
        this.state = !this.state;
        this.$btn.toggleClass(Timer.playClassName);
        this.$timer.toggleClass(Timer.playClassName);

        this.state? this.play(): this.pause();
    }

    reset() {
        if (this.digitsClock && this.digitsClock.duration === FILTER_DURATION) {
            return;
        }

        this.$timer.empty();
        this.digitsClock = new DigitsClock(FILTER_DURATION, this._onEnd).stop();
        this.sandClock = new SandClock(FILTER_DURATION, () => {}).stop();

        this.$timer
            .prepend(this.digitsClock.getContainer())
            .prepend(this.sandClock.getContainer());
    }

    start() {
        this.reset();

        this.digitsClock.start();
        this.sandClock.start();
    }

    setOnEnd(cb: Function) {
        this._onEnd = cb;
    }

    private play() {
        if (!this.digitsClock) {
            this.start();
            return;
        }

        this.digitsClock.start();
        this.sandClock.start();
    }

    private pause() {
        this.digitsClock.stop();
        this.sandClock.stop();
    }
}

class ReplaceFilterBtn {
    static replaceFilterTimeout = 500;
    isPrev: boolean;
    className: string;
    $btn: JQuery;

    constructor(isPrev: boolean) {
       this.isPrev = isPrev;

       this.onClick = this.onClick.bind(this);
       this.updateText = this.updateText.bind(this);
       this.replaceFilter = this.replaceFilter.bind(this);

       this.className = isPrev? `${cssPrefix()}prev`: `${cssPrefix()}next`;
       this.$btn = jQuery(`<div class="${this.className}">`);
       this.$btn.on('click', this.onClick);

       this.updateText();
    }

    getBtn() {
        return this.$btn;
    }

    updateText() {
        setTimeout(() => this.$btn.text(this.getFilter().text()), ReplaceFilterBtn.replaceFilterTimeout + 200);
    }

    getFilter() {
        const filters = ReplaceFilterBtn.getFilters();
        const filterIndex = this.getFilterIndex(filters);

        return jQuery(filters[filterIndex]);
    }

    replaceFilter() {
        const filters = ReplaceFilterBtn.getFilters();
        const selected = this.getSelected(filters);
        let nextIndex = this.getFilterIndex(filters);

        selected.each((i: Number, e: Element) => this.clickOnFilter(e));

        this.clickOnFilter(filters[nextIndex], ReplaceFilterBtn.replaceFilterTimeout);
    }

    isLast() {
        const filters = ReplaceFilterBtn.getFilters();
        const filterIndex = this.getFilterIndex(filters);

        return (filterIndex === filters.length - 1);
    }

    private getSelected(filters: JQuery) {
        return jQuery(filters).has('a' + activeFilterSelector);
    }

    private clickOnFilter(filter: Element, wait=0) {
        setTimeout(() => jQuery(filter).find('a')[0].click(), wait);
    }

    static getFilters() {
        return jQuery(`${quickFiltersSelector} dd`)
            .has('a.js-quickfilter-button');
    }

    private getFilterIndex(filters: JQuery) {
        const selected = this.getSelected(filters);
        const lastSelectedIndex = selected.last().index();
        let nextIndex = this.isPrev ? lastSelectedIndex - 2 : lastSelectedIndex;
        let lastFilter = filters.length - 1;

        if (lastSelectedIndex === -1) {
            return this.isPrev? 0: lastFilter;
        }

        if (nextIndex >= filters.length) {
            return 0;
        }

        if (nextIndex < 0) {
            return lastFilter;
        }

        return nextIndex;
    }

    private onClick() {
        this.replaceFilter();
    }
}

class DailyActions {
    static containerSelector = '#ghx-modes-tools';
    static className = `${cssPrefix()}wrapper`;
    container: JQuery;

    prevFilter: ReplaceFilterBtn;
    nextFilter: ReplaceFilterBtn;
    timer: Timer;

    constructor() {
        this.next = this.next.bind(this);

        this.container = jQuery(DailyActions.containerSelector);
        this.container
            .prepend(`<div class="${DailyActions.className}">`);

        this.prevFilter = new ReplaceFilterBtn(true);
        this.nextFilter = new ReplaceFilterBtn(false);
        this.timer = new Timer(this.next);

        ReplaceFilterBtn
            .getFilters()
            .find('a')
            .on('click', () => {
                this.nextFilter.updateText();
                this.prevFilter.updateText();
                if (!this.timer.state) {
                    this.timer.reset();
                }
            });

        jQuery(`.${DailyActions.className}`)
            .prepend(this.prevFilter.getBtn())
            .append(this.timer.getBtn())
            .append(this.nextFilter.getBtn());
    }

    next() {
        this.nextFilter.replaceFilter();

        if (this.nextFilter.isLast()) {
            this.timer.setOnEnd(this.timer.toggleState);
        }

        setTimeout(this.timer.start, 1000);
    }
}

chrome.storage.sync.get('jd-duration', (storageValues: any) => {
    FILTER_DURATION = storageValues['jd-duration'];
});

(($) => {
    $(window).on('load', () => {
        let $quickfilters = $(quickFiltersSelector);
        if(!$quickfilters.length) {
            return;
        }

        new DailyActions();
    });
})(jQuery);

chrome.storage.onChanged.addListener(function(changes: any) {

    let storageVal = changes['jd-duration']? changes['jd-duration'].newValue: 0;
    storageVal = Number(storageVal);
    
    if (!storageVal || storageVal < 3) {
        return;
    }

    console.log('storageValues', changes, storageVal);

    FILTER_DURATION = storageVal;
});