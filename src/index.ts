import '@logseq/libs' //https://plugins-doc.logseq.com/
import { LSPluginBaseInfo, PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import { setup as l10nSetup } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
import ja from "./translations/ja.json"
import fileTooltipCSS from "./tooltip.css?inline"
import { settingsTemplate } from './settings'
import { getPageProperties } from './query/advancedQuery'


/* main */
const main = async () => {
    await l10nSetup({ builtinTranslations: { ja } })
    /* user settings */
    logseq.useSettingsSchema(settingsTemplate())
    if (!logseq.settings) setTimeout(() => logseq.showSettingsUI(), 300)

    logseq.provideStyle(fileTooltipCSS)

    logseq.App.onSidebarVisibleChanged(async ({ visible }) => {
        if (visible === true) {
            observer.disconnect()
            observerMainRight()
        }
    })

    setTimeout(() => observerMainRight(), 500)

    logseq.onSettingsChanged((newSet: LSPluginBaseInfo['settings'], oldSet: LSPluginBaseInfo['settings']) => {
        //更新されたら
        if (newSet.firstLetter !== oldSet.firstLetter
            || newSet.eliminatesLevels !== oldSet.eliminatesLevels
            || newSet.booleanUseDot !== oldSet.booleanUseDot
            || newSet.iconMode !== oldSet.iconMode
        ) restoreAllNamespaces()
    })
    logseq.beforeunload(async () => {
        restoreAllNamespaces()
    })

}/* end_main */


const callback = () => {
    //callback関数
    observer.disconnect()
    pageRefQuerySelectorAll()
    setTimeout(() => observerMainRight(), 1000)
}

// コールバック関数に結びつけられたオブザーバーのインスタンスを生成
const observer = new MutationObserver(callback)



//セレクターに一致するエレメントに処理をおこなう

//.recent-item[data-ref*="/"],
//div.kef-ae-fav-item-name[title*="/"],
let processingPageRefQuery: boolean = false
const pageRefQuerySelectorAll = async (): Promise<void> => {
    if (processingPageRefQuery === true) return
    processingPageRefQuery = true
    parent.document.body.querySelectorAll(
        'div#root>div>main div:is(#main-content-container,#right-sidebar) a[data-ref*="/"]:not([data-orig-text]), div#root>div>main div#left-sidebar li[data-ref*="/"] span.page-title:not([data-orig-text])'
    ).forEach(
        (element) => abbreviateNamespace(element as HTMLElement)
    )
    parent.document.body.querySelectorAll(
        'div#root>div>main div:is(#main-content-container,#right-sidebar) a.page-ref:not([data-ref*="/"]):not([data-icon])'
    ).forEach((element) =>
        SetLinksIconWithoutHierarchy(element as HTMLElement)
    )
    processingPageRefQuery = false
}



const observerMainRight = () => {
    //対象ノードの監視スタート
    observer.observe(
        parent.document.getElementById("main-content-container") as HTMLDivElement, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    })
    observer.observe(
        parent.document.getElementById("right-sidebar") as HTMLDivElement, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    })
}



const abbreviateNamespace = (namespaceRef: HTMLElement) => {

    if (!namespaceRef
        || namespaceRef.dataset!.origText
        || !namespaceRef.textContent) return

    const textString: string = namespaceRef.textContent

    if (!textString.includes("/")) return//textに「/」が含まれているかどうか

    if (logseq.settings!.booleanIgnoreHash === true
        && textString.startsWith("#")) return //先頭に#がある場合は省略をしない

    // Perform collapsing.
    const splitString: Array<string> = textString.split('/')

    if (logseq.settings!.iconMode !== "false"
        && !namespaceRef.dataset.icon) getIcon(namespaceRef, splitString[0] as string)

    const abbreviatedText = abbreviated(splitString, logseq.settings!.booleanUseDot === true ? ".." : "") as string

    if (abbreviatedText === textString) {
        namespaceRef.dataset.origText = namespaceRef.textContent || ""
        return
    }
    namespaceRef.dataset.origText = textString || ""
    if (logseq.settings!.booleanGrayOut) {
        namespaceRef.innerHTML = abbreviatedText // HTMLとして挿入
    } else {
        namespaceRef.textContent = abbreviatedText.replace(/<[^>]*>/g, '') // HTMLタグを除去
    }
    namespaceRef.classList.add("shortNamespaceTooltip")//CSSでtooltipを表示する
}



const abbreviated = (stringArray: Array<string>, dot: string): string => {
    const intendedText: string = stringArray[stringArray.length - 1] || ""
    if (logseq.settings!.eliminatesLevels === "All levels"
        && !(/^\d+$/.test(intendedText)
            || /, \d+$/.test(intendedText)))
        // 階層はすべて消す場合
        return intendedText || ""
    else {
        // 階層を残す場合
        return stringArray.map((part, index, arr) => {
            //数字は除外(日付)
            //partに「Fri, 2023」のように曜日と年がある場合は除外
            if (/^\d+$/.test(part)
                || /, \d+$/.test(part))
                return part
            else
                if ((index === arr.length - 1
                    || (logseq.settings!.eliminatesLevels === "2 levels"
                        && index === arr.length - 2)
                    || (
                        logseq.settings!.eliminatesLevels === "3 levels"
                        && (index === arr.length - 2
                            || index === arr.length - 3))
                )) {
                    // 最後の階層はグレーアウトしない
                    return part
                }
                else {
                    let abbreviatedPart = ""
                    switch (logseq.settings!.firstLetter) {
                        case "The first letter":
                            if (part.length <= 1) abbreviatedPart = part//1文字の場合はdotをつけない
                            else abbreviatedPart = part.charAt(0) + dot
                            break
                        case "Abbreviate(..)":
                            abbreviatedPart = ".."
                            break
                        case "The first 2 letters":
                            if (part.length <= 2) abbreviatedPart = part//2文字未満の場合はdotをつけない
                            else abbreviatedPart = part.substring(0, 2) + dot
                            break
                        case "The first 3 letters":
                            if (part.length <= 3) abbreviatedPart = part
                            else abbreviatedPart = part.substring(0, 3) + dot
                            break
                        case "The first 4 letters":
                            if (part.length <= 4) abbreviatedPart = part
                            else abbreviatedPart = part.substring(0, 4) + dot
                            break
                        default:
                            abbreviatedPart = part
                    }
                    // 親階層をspanでラップ
                    return `<span class="namespace-parent">${abbreviatedPart}</span>`
                }
        }).join('/')
    }
}

const getIcon = async (namespaceRef, parent: string): Promise<void> => {
    //parentの先頭に#ある場合は削除
    if (parent.startsWith("#")) parent = parent.slice(1)
    const properties = await getPageProperties(parent) as PageEntity["properties"] || null
    if (!namespaceRef.dataset.icon //非同期処理のため必要。既にアイコンがある場合は処理しない
        && properties
        && properties.icon) {
        
        namespaceRef.insertAdjacentHTML("beforebegin", properties.icon as string)
        namespaceRef.dataset.icon = properties.icon as string
    }
}


const SetLinksIconWithoutHierarchy = async (elementRef: HTMLElement): Promise<void> => {
    //「/」をもたないリンクにアイコンをつける
    if (!elementRef
        || elementRef.dataset!.icon) return

    let text = elementRef.textContent as string | null
    if (!text
        || text.includes("/")) return

    if (text.startsWith("#")) text = text.slice(1)

    const properties = await getPageProperties(text) as PageEntity["properties"] || null
    if (!properties
        || properties!.icon === undefined) {
        elementRef.dataset.icon = "none"
        return
    }
    if (elementRef.dataset.icon) return//非同期処理のため必要。既にアイコンがある場合は処理しない

    elementRef.insertAdjacentHTML("beforebegin", properties.icon as string)
    elementRef.dataset.icon = properties.icon as string
}


//元に戻す
const restoreAllNamespaces = () =>
    parent.document.body.querySelectorAll(
        ':is(#main-content-container,#right-sidebar) a[data-ref*="/"][data-orig-text], #left-sidebar li[data-ref*="/"] span.page-title[data-orig-text]'
    ).forEach((element) =>
        restoreNamespace(element as HTMLElement)
    )
const restoreNamespace = (namespaceRef: HTMLElement) => {
    if (namespaceRef
        && namespaceRef.dataset!.origText) {
        namespaceRef.textContent = namespaceRef.dataset.origText
        delete namespaceRef.dataset.origText
    }
}


logseq.ready(main).catch(console.error)