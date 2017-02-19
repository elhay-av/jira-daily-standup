///<reference path="../node_modules/@types/jquery/index.d.ts" />
declare const chrome: any;
(() => {
    const STORAGE_KEY = 'jd-duration';

    chrome.storage.sync.get(STORAGE_KEY, (storageValues: any) => {
        jQuery('#time').val(storageValues[STORAGE_KEY])
    });

    jQuery('#time').on('keyup', (element: any) => {
        chrome.storage.sync.set({[STORAGE_KEY]: element.target.value});
    });
})();