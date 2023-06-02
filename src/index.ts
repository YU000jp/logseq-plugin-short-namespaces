import '@logseq/libs'; //https://plugins-doc.logseq.com/
import { logseq as PL } from "../package.json";
const pluginId = PL.id; //set plugin id from package.json
//import { setup as l10nSetup, t } from "logseq-l10n"; //https://github.com/sethyuan/logseq-l10n
//import ja from "./translations/ja.json";


/* main */
const main = () => {
    console.info(`#${pluginId}: MAIN`); //console
    // (async () => {
    //     try {
    //         await l10nSetup({ builtinTranslations: { ja } });
    //     } finally {
    //         /* user settings */
    //         logseq.useSettingsSchema(settingsTemplate);
    //         if (!logseq.settings) {
    //             setTimeout(() => {
    //                 logseq.showSettingsUI();
    //             }
    //                 , 300);
    //         }
    //     }
    // })();


    logseq.App.onRouteChanged(async () => {
        setTimeout(() => {
            titleQuerySelector();
        }, 200);
    });


    logseq.App.onSidebarVisibleChanged(async ({ visible }) => {
        if (visible === true) {
            setTimeout(() => {
                titleQuerySelector();
            }, 300);
        }
    });

    observer.observe(parent.document.getElementById("main-content-container") as HTMLDivElement, {
        attributes: true,
        subtree: true,
        attributeFilter: ["class"],
    });

    console.info(`#${pluginId}: loaded`);//console
};/* end_main */


const observer = new MutationObserver(() => {
    titleQuerySelector();
});


function titleQuerySelector() {
    //.recent-item[data-ref*="/"],
    parent.document.querySelectorAll('div.ls-block a.page-ref[data-ref*="/"],  .foldable-title [data-ref*="/"], li[title*="root/"], a.tag[data-ref*="/"]').forEach((element) => {
        abbreviateNamespace(element as HTMLElement);
    });
}


function abbreviateNamespace(namespaceRef: HTMLElement) {
    if (namespaceRef && !(namespaceRef.dataset!.origText)) {
        const text = namespaceRef.textContent;
        const testText = namespaceRef.classList.contains("tag")
            ? text!.substring(1).toLowerCase()
            : text!.toLowerCase();
        if (testText !== namespaceRef.dataset.ref) return;

        // Perform collapsing.
        let abbreviatedText;
        const parts = text!.split('/');
        if (namespaceRef.classList.contains("tag")) {
            abbreviatedText = parts.map((part, index, arr) => {
                if (/^\d+$/.test(part) || index === arr.length - 1 || index === arr.length - 2) {
                    return part;
                } else if (index === 0) {
                    return "#..";//part.substring(0, 2);
                } else {
                    return "..";//part.charAt(0);
                }
            }).join('/');
        } else {
            abbreviatedText = parts.map((part, index, arr) => {
                if (/^\d+$/.test(part) || index === arr.length - 1 || index === arr.length - 2) {
                    return part;
                } else {
                    return "..";
                }
            }).join('/');
        }
        namespaceRef.dataset.origText = text || "";
        namespaceRef.textContent = abbreviatedText;

        // Show entire string on hover
        namespaceRef.addEventListener('mouseenter', () => {
            namespaceRef.textContent = namespaceRef.dataset.origText || "";
        });

        namespaceRef.addEventListener('mouseleave', () => {
            namespaceRef.textContent = abbreviatedText;
        });
    }
}


/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
// const settingsTemplate = [

// ];


logseq.ready(main).catch(console.error);