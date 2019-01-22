///<reference path="../node_modules/@types/jquery/index.d.ts" />
jQuery(() => {
    const cssPrefix = (prefix='') => 'jd-' + prefix;
	const quickFiltersSelector = '#ghx-quick-filters:visible';
	const quickFilterSelector = '#quickFilterList>ul>li';
    const activeFilterSelector = '.checked';
    const STORAGE_KEY = 'jd-duration';
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

    interface IRenderedComponent {
        $container: JQuery;
        destroy(): void;
    }

    class RenderedComponent implements IRenderedComponent {
        $container: JQuery;

        constructor(_$container: JQuery) {
            this.$container = _$container;
        }

        destroy() {
            this.$container.remove();
            this.$container = jQuery();
        }
    }

    class Clock extends RenderedComponent implements IClock {
        interval: number;
        duration: number;
        className: string;
        $container: JQuery;
        _onEnd: Function;

        constructor(duration: number, onEnd: any, className: string) {
            const _className = `${cssPrefix() + className}-clock`;
            super(jQuery(`<div class="${_className}">`));

            this._onEnd = onEnd;
            this.duration = duration;
            this.className = _className;

            this.onEnd = this.onEnd.bind(this);
            this.start = this.start.bind(this);
            this.onChange = this.onChange.bind(this);
        };

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

        destroy() {
            this.stop();
            super.destroy();
        }
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

    class Timer extends RenderedComponent {
        static playClassName = `${cssPrefix()}play`;
        static timerClassName = `${cssPrefix()}timer`;

        className: string;
        $btn: JQuery;
        $container: JQuery;
        state: boolean;

        _onEnd: Function;

        digitsClock: DigitsClock | Clock;
        sandClock: SandClock | Clock;

        constructor(onEnd: any) {
            super(jQuery(`<div class="${Timer.timerClassName}">`));

            this.setOnEnd(onEnd);
            this.className = `${cssPrefix()}play-pause-btn`;
            this.$btn = jQuery(`<div class="${this.className}">`);

            jQuery('body').prepend(this.$container);

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
            this.$container.toggleClass(Timer.playClassName);

            this.state? this.play(): this.pause();
        }

        reset() {
            if (this.digitsClock && this.digitsClock.duration === FILTER_DURATION) {
                return;
            }

            this.$container.empty();

            if (this.digitsClock) {
                this.digitsClock.destroy();
                this.sandClock.destroy();
            }

            this.digitsClock = new DigitsClock(FILTER_DURATION, this._onEnd).stop();
            this.sandClock = new SandClock(FILTER_DURATION, () => {}).stop();

            this.$container
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
        static $filters: JQuery;
        static predefineFilters: Array<string> = ['Recently Updated', 'Done', 'Not Done', 'Only My Issues'];
        isPrev: boolean;
        className: string;
        $btn: JQuery;
        filtersIds: string[] = [];

        constructor(isPrev: boolean) {
            this.isPrev = isPrev;

            this.onClick = this.onClick.bind(this);
            this.updateText = this.updateText.bind(this);
            this.replaceFilter = this.replaceFilter.bind(this);

            ReplaceFilterBtn.setFilters();
            this.className = isPrev? `${cssPrefix()}prev`: `${cssPrefix()}next`;
            this.$btn = jQuery(`<div class="${this.className}">`);
            this.$btn.on('click', this.onClick);

	        ReplaceFilterBtn.$filters.map((key, filter) => this.filtersIds.push(filter.id));
            this.updateText();
        }

        getBtn() {
            return this.$btn;
        }

        updateText() {
            setTimeout(() => this.$btn.text(this.getFilter().text()), ReplaceFilterBtn.replaceFilterTimeout + 200);
        }

        getFilter() {
            const filters = ReplaceFilterBtn.$filters;
            const filterIndex = this.getFilterIndex(filters);

            return jQuery(filters.filter('#' + this.filtersIds[filterIndex]));
        }

        replaceFilter() {
            const filters = ReplaceFilterBtn.$filters;
            const selected = this.getSelected(filters);
            let nextIndex = this.getFilterIndex(filters);

            selected.each((i: Number, e: Element) => this.clickOnFilter(e));

            this.clickOnFilter(filters[nextIndex], ReplaceFilterBtn.replaceFilterTimeout);
        }

        isLast() {
            const filters = ReplaceFilterBtn.$filters;
            const filterIndex = this.getFilterIndex(filters);

            return (filterIndex === filters.length - 1);
        }

        private getSelected(filters: JQuery) {
            return jQuery(filters).has('label' + activeFilterSelector);
        }

        private clickOnFilter(filter: Element, wait=0) {
            setTimeout(() => jQuery(filter).click(), wait);
        }

        static setFilters() {
            ReplaceFilterBtn.$filters = jQuery(`${quickFiltersSelector} ${quickFilterSelector}`)
                .filter((key, item) => item.id)
                .filter((key, item) => ReplaceFilterBtn.predefineFilters.indexOf(jQuery(item).text()) === -1);
        }

        private getFilterIndex(filters: JQuery) {
            const selected = this.getSelected(filters);
            const lastSelectedIndex = this.filtersIds.indexOf(selected.last().attr('id'));
            let nextIndex = this.isPrev ? lastSelectedIndex - 1 : lastSelectedIndex + 1;
            let lastFilter = filters.length - 1;

	        if (lastSelectedIndex === -1) {
                return this.isPrev? 0: lastFilter;
            }

            if (nextIndex > filters.length) {
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
            jQuery('.' + DailyActions.className).remove();
            this.next = this.next.bind(this);
            this.onPluginFilterButtonClick = this.onPluginFilterButtonClick.bind(this);

            this.container = jQuery(DailyActions.containerSelector);
            this.container
                .prepend(`<div class="${DailyActions.className}">`);

            this.prevFilter = new ReplaceFilterBtn(true);
            this.nextFilter = new ReplaceFilterBtn(false);
            this.timer = new Timer(this.next);

            this.prevFilter.getBtn().on('click', this.onPluginFilterButtonClick);
            this.nextFilter.getBtn().on('click', this.onPluginFilterButtonClick);

            ReplaceFilterBtn.$filters
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

        onPluginFilterButtonClick() {
            if (this.timer.state) {
                this.timer.reset();
                this.timer.start();
            }
        }
    }

    chrome.storage.sync.get(STORAGE_KEY, (storageValues: any) => {
        FILTER_DURATION = storageValues[STORAGE_KEY];
    });

    chrome.storage.onChanged.addListener(function(changes: any) {

        let storageVal = changes[STORAGE_KEY]? changes[STORAGE_KEY].newValue: 0;
        storageVal = Number(storageVal);

        if (!storageVal || storageVal < 3) {
            return;
        }

        FILTER_DURATION = storageVal;
    });

    // Start
    if(jQuery(quickFiltersSelector).length) {
        new DailyActions();
    }
});
