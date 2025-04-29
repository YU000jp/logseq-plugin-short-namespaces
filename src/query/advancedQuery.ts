import { PageEntity } from "@logseq/libs/dist/LSPlugin.user"

// クエリを実行
export const advancedQuery = async <T>(query: string, ...input: Array<string>): Promise<T | null> => {
  try {
    const result = await logseq.DB.datascriptQuery(query, ...input)
    return result?.flat() as T
  } catch (err) {
    console.warn("Query execution failed:", err)
    return null
  }
}

// フィールドを取得するクエリ
const createBaseQuery = (field: string): string => `
  [:find (pull ?b [:block/${field}])
   :in $ ?name
   :where
   [?b :block/original-name ?name]
   [?b :block/${field} ?${field}]] 
`

// ページ名からpropertiesを取得するクエリ
export const getPageProperties = async (pageOriginalName: string): Promise<PageEntity["properties"] | null> => {
  const result = await advancedQuery<{ properties: PageEntity["properties"] }[]>(createBaseQuery("properties"), `"${pageOriginalName}"`)
  return result?.[0]?.["properties"] ?? null
}
