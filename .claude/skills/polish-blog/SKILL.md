---
name: polish-blog
description: 潤飾 NobodyClimb 文章可讀性，修長句、但書密度、數字堆疊與模板化語氣，保護事實、引語、來源連結與立場。既有文發布沿用 update-blog。
---

# 保真潤稿

讀 [寫作指引](../write-blog/references/writing.md)，先讀全文與來源台帳，定讀者問題及原本承諾。長句、抽象主詞、過量引述、但書或數字堆疊是診斷訊號；按語意拆句/換具體動作/重排，不機械限制字數或每句數字。

保護數字、單位、姓名、日期、否定、適用限制、引語歸屬、URL 與結論確定程度。不能把相關性改成因果、把品牌建議改成實測、把短引文改成全文。引語改為轉述時維持來源与含義；發現疑似事實錯誤交 [verify-blog](../verify-blog/SKILL.md)，不憑印象改。

更新摘要/標題時核對正文承諾；多輪修改後完整回讀接縫、指代、數字一致性，再看 diff 是否丟掉仍成立的資訊。記錄改動與未處理事實問題到 `<id>.review.md`，執行 article checker。既有文章需要發布時走 [update-blog](../update-blog/SKILL.md) 的原稿修改與 PR，不另建直接寫 production 路徑。

潤稿會改變完整原稿 hash，既有 sources.json 和 review.json 核准立即過期；交回 verify/review 重新核對受影響主張及三語，不只重算 hash 放行。
