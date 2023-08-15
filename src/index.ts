import '@logseq/libs'; //https://plugins-doc.logseq.com/
import { LSPluginBaseInfo, PageEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';
//import { setup as l10nSetup, t } from "logseq-l10n"; //https://github.com/sethyuan/logseq-l10n
//import ja from "./translations/ja.json";
import fileTooltipCSS from "./tooltip.css?inline";
let restore: Boolean = false;




/* main */
const main = () => {
    // (async () => {
    //     try {
    //         await l10nSetup({ builtinTranslations: { ja } });
    //     } finally {
    /* user settings */
    logseq.useSettingsSchema(settingsTemplate());
    if (!logseq.settings) setTimeout(() => logseq.showSettingsUI(), 300);
    //     }
    // })();

    logseq.provideStyle(fileTooltipCSS);

    logseq.App.onSidebarVisibleChanged(async ({ visible }) => {
        if (visible === true) {
            observer.disconnect();
            observerMainRight();
        }
    });

    setTimeout(() => observerMainRight(), 500);

    logseq.onSettingsChanged((newSet: LSPluginBaseInfo['settings'], oldSet: LSPluginBaseInfo['settings']) => {
        //更新されたら
        if (newSet !== oldSet) restoreAllNamespaces();
    });
    logseq.beforeunload(async () => {
        restoreAllNamespaces();
        restore = true;
    });

};/* end_main */




const callback = () => {
    //callback関数
    observer.disconnect();
    pageRefQuerySelectorAll();
    setTimeout(() => observerMainRight(), 1000);
}

// コールバック関数に結びつけられたオブザーバーのインスタンスを生成
const observer = new MutationObserver(callback);



//セレクターに一致するエレメントに処理をおこなう

//.recent-item[data-ref*="/"],
//div.kef-ae-fav-item-name[title*="/"],
let processingPageRefQuery: boolean = false;
const pageRefQuerySelectorAll = async (): Promise<void> => {
    if (processingPageRefQuery === true) return;
    processingPageRefQuery = true;
    parent.document.querySelectorAll(
        'div:is(#main-content-container,#right-sidebar) a[data-ref*="/"]:not([data-orig-text]), div#left-sidebar li[data-ref*="/"] span.page-title:not([data-orig-text])'
    ).forEach(
        (element) => abbreviateNamespace(element as HTMLElement)
    );
    parent.document.querySelectorAll(
        'div:is(#main-content-container,#right-sidebar) a.page-ref:not([data-ref*="/"]):not([data-icon])'
    ).forEach((element) =>
        SetLinksIconWithoutHierarchy(element as HTMLElement)
    );
    processingPageRefQuery = false;
};



function observerMainRight() {
    //対象ノードの監視スタート
    observer.observe(
        parent.document.getElementById("main-content-container") as HTMLDivElement, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
    observer.observe(
        parent.document.getElementById("right-sidebar") as HTMLDivElement, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
}



function abbreviateNamespace(namespaceRef: HTMLElement) {

    if (!namespaceRef || (namespaceRef.dataset!.origText)) return;
    const text = namespaceRef.textContent;
    if (!text || !text.includes("/")) return;//textに「/」が含まれているかどうか

    // Perform collapsing.
    const splitText = text.split('/') as Array<string>;
    if (logseq.settings!.iconMode !== "false"
        && !namespaceRef.dataset.icon) getIcon(namespaceRef, splitText[0] as string);
    const abbreviatedText = abbreviated(splitText, logseq.settings!.booleanUseDot === true ? ".." : "") as string;
    if (abbreviatedText === text) {
        namespaceRef.dataset.origText = namespaceRef.textContent || "";
        return;
    }

    namespaceRef.dataset.origText = text || "";
    namespaceRef.textContent = abbreviatedText;
    namespaceRef.classList.add("shortNamespaceTooltip");//CSSでtooltipを表示する
}



const abbreviated = (text: Array<string>, dot: string): string =>
    text.map((part, index, arr) => {
        //数字は除外(日付)
        //partに「Fri, 2023」のように曜日と年がある場合は除外
        if (/^\d+$/.test(part)
            || /, \d+$/.test(part)) {
            return part;
        } else
            if ((index === arr.length - 1
                || (logseq.settings!.eliminatesLevels === "2 levels"
                    && index === arr.length - 2)
                || (
                    logseq.settings!.eliminatesLevels === "3 levels"
                    && (index === arr.length - 2
                        || index === arr.length - 3))
            )) {
                return part;
            } else {
                switch (logseq.settings!.firstLetter) {
                    case "The first letter":
                        if (part.length <= 1) return part;//1文字の場合はdotをつけない
                        return part.charAt(0) + dot;
                    case "Abbreviate(..)":
                        return "..";
                    case "The first 2 letters":
                        if (part.length <= 2) return part;//2文字未満の場合はdotをつけない
                        return part.substring(0, 2) + dot;
                    case "The first 3 letters":
                        if (part.length <= 3) return part;
                        return part.substring(0, 3) + dot;
                    case "The first 4 letters":
                        if (part.length <= 4) return part;
                        return part.substring(0, 4) + dot;
                    default:
                        return part;
                }
            }
    }).join('/');


const getIcon = async (namespaceRef, parent: string): Promise<void> => {
    //parentの先頭に#ある場合は削除
    if (parent.startsWith("#")) parent = parent.slice(1);
    const page = await logseq.Editor.getPage(parent) as PageEntity;
    if (page && page.properties?.icon) {
        if (namespaceRef.dataset.icon) return;//非同期処理のため必要。既にアイコンがある場合は処理しない
        namespaceRef.insertAdjacentHTML("beforebegin", page.properties.icon as string);
        namespaceRef.dataset.icon = page.properties.icon as string;
    }
};


async function SetLinksIconWithoutHierarchy(elementRef: HTMLElement): Promise<void> {
    //「/」をもたないリンクにアイコンをつける
    if (!elementRef || elementRef.dataset!.icon !== undefined) return;
    let text = elementRef.textContent;
    if (!text || text.includes("/")) return;
    if (text.startsWith("#")) text = text.slice(1);
    const page = await logseq.Editor.getPage(text) as PageEntity;
    if (!page || !page.properties?.icon) {
        elementRef.dataset.icon = "none";
        return;
    }
    if (elementRef.dataset.icon) return;//非同期処理のため必要。既にアイコンがある場合は処理しない
    elementRef.insertAdjacentHTML("beforebegin", page.properties.icon as string);
    elementRef.dataset.icon = page.properties.icon as string;
}


//元に戻す
const restoreAllNamespaces = () =>
    parent.document.querySelectorAll(
        'div:is(#main-content-container,#right-sidebar) a[data-ref*="/"][data-orig-text], div#left-sidebar li[data-ref*="/"] span.page-title[data-orig-text]'
    ).forEach((element) =>
        restoreNamespace(element as HTMLElement)
    );
const restoreNamespace = (namespaceRef: HTMLElement) => {
    if (namespaceRef && namespaceRef.dataset!.origText) {
        namespaceRef.textContent = namespaceRef.dataset.origText;
        delete namespaceRef.dataset.origText;
    }
};


/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
const settingsTemplate = (): SettingSchemaDesc[] => [
    {
        //option for first letter of Root page name
        key: "firstLetter",
        type: "enum",
        enumChoices: ["Abbreviate(..)", "The first letter", "The first 2 letters", "The first 3 letters", "The first 4 letters"],
        title: "Show First letter of Root page name",
        default: "The first 2 letters",
        description: "default: The first 2 letters",
    },
    {
        //Eliminates hierarchies of more than two levels
        key: "eliminatesLevels",
        type: "enum",
        enumChoices: ["1 level", "2 levels", "3 levels"],
        title: "Eliminates hierarchies of more than 2 levels",
        default: "2 levels",
        description: "default: 2 levels",
    },
    {
        //Use dot instead of slash
        key: "booleanUseDot",
        type: "boolean",
        title: "Use dot instead",
        default: true,
        description: "default: true",
    },
    {//Enable Icon mode
        key: "iconMode",
        type: "enum",
        //先頭の親ページのみアイコンを表示す親
        title: "Enable display icon only for the first parent page",
        default: false,
        enumChoices: ["false", "icon and text"],//icon only
        description: "default: false (⚠️need to restart Logseq to take effect)",
    },
];

logseq.ready(main).catch(console.error);