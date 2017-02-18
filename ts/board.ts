const cssPrefix = (prefix='') => 'jd-' + prefix;
const quickFiltersSelector = '#js-work-quickfilters';
const activeFilterSelector = '.ghx-active';

class ReplaceFilterBtn {
    static replaceFilterTimeout = 500;
    isPrev: boolean;
    className: string;
    $btn: any;

    constructor(isPrev: boolean) {
       this.isPrev = isPrev;

       this.onClick = this.onClick.bind(this);
       this.updateText = this.updateText.bind(this);

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

    private getSelected(filters: any) {
        return jQuery(filters).has('a' + activeFilterSelector);
    }

    private clickOnFilter(filter: Element, wait=0) {
        setTimeout(() => jQuery(filter).find('a')[0].click(), wait);
    }

    static getFilters() {
        return jQuery(`${quickFiltersSelector} dd`)
            .has('a.js-quickfilter-button');
    }

    private replaceFilter() {
        const filters = ReplaceFilterBtn.getFilters();
        const selected = this.getSelected(filters);
        let nextIndex = this.getFilterIndex(filters);

        selected.each((i: Number, e: Element) => this.clickOnFilter(e));

        this.clickOnFilter(filters[nextIndex], ReplaceFilterBtn.replaceFilterTimeout);
    }

    private getFilterIndex(filters: any) {
        const selected = this.getSelected(filters);
        const lastSelectedIndex = selected.last().index();
        let nextIndex = this.isPrev ? lastSelectedIndex - 2 : lastSelectedIndex;
        let lastFilter = filters.size() - 1;

        if (lastSelectedIndex === -1) {
            return this.isPrev? 0: lastFilter;
        }

        if (nextIndex >= filters.size()) {
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
    container: any;

    constructor() {
        this.container = jQuery(DailyActions.containerSelector);
        this.container
            .prepend(`<div class="${DailyActions.className}">`);

        const prevFilter = new ReplaceFilterBtn(true);
        const nextFilter = new ReplaceFilterBtn(false);

        ReplaceFilterBtn
            .getFilters()
            .find('a')
            .on('click', () => {
                nextFilter.updateText();
                prevFilter.updateText();
            });

        jQuery(`.${DailyActions.className}`)
            .prepend(prevFilter.getBtn())
            .append(nextFilter.getBtn());
    }
}

(($) => {
    $(window).on('load', () => {
        let $quickfilters = $(quickFiltersSelector);
        if(!$quickfilters.length) {
            return;
        }

        new DailyActions();
    });
})(jQuery);