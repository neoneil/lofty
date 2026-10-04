# IELTS Reading 静态题库 OCR 拼写审计

审计范围：Cambridge IELTS 7-21，4 Tests/册，3 Passages/Test，共 180 个 Reading Markdown 文件。

首次审计列出候选，编号供人工筛选使用。`确定`表示结合上下文可以明确判断；`待核原书`表示存在 OCR 异常，但建议对照 PDF 页面后再定最终文本。

## 修复状态（2026-10-04）

- R001-R031 已按用户确认全部修复。
- 修复覆盖 23 个 Markdown 文件以及其中会被运行时读取的重复 JSON/HTML/翻译字段。
- 修复后旧错误字符串复查：R001-R031 全部为 0 个残留。
- 重新解析 Cambridge 7-21 共 180 个 Reading Markdown：180 个通过，0 个 YAML/JSON 解析错误。
- 修复后重新运行全库 OCR 候选扫描；新增的 3 个确定错误 R041-R043 已全部修复。
- 第二轮修复后再次解析 Cambridge 7-21 共 180 个 Reading Markdown：180 个通过，0 个 YAML/JSON 解析错误。
- 用户确认的疑似项 R032、R033、R034、R036、R037、R040 已修复；R035、R038、R039 保持待确认状态。

## A. 已确认并修复的拼写/OCR 错误

| ID | 位置 | 当前文本 | 建议文本 | 类型 |
| --- | --- | --- | --- | --- |
| R001 | C7 Test 3 Passage 2，题目选项 | `modem Americans` | `modern Americans` | `rn` 被识别为 `m` |
| R002 | C8 Test 4 Passage 1，题目选项 | `supplementary tuilion` | `supplementary tuition` | 漏字母 |
| R003 | C8 Test 4 Passage 1，文章 | `would be assited` | `would be assisted` | 漏字母 |
| R004 | C8 Test 4 Passage 2，文章 | `geneticalyy stronger` | `genetically stronger` | 字母错位 |
| R005 | C9 Test 1 Passage 1，Question 7 | `discoveries ol the famous scientist` | `discoveries of the famous scientist` | `f` 被识别为 `l` |
| R006 | C9 Test 1 Passage 2，文章 | `lt's not important` | `It's not important` | 大写 `I` 被识别为小写 `l` |
| R007 | C9 Test 1 Passage 3，文章 | `all modem turtles` | `all modern turtles` | `rn` 被识别为 `m` |
| R008 | C9 Test 2 Passage 2，文章 | `todays value` | `today's value` | 缺少撇号 |
| R009 | C9 Test 2 Passage 3，文章 | `how the braln works` | `how the brain works` | `i` 被识别为 `l` |
| R010 | C9 Test 2 Passage 3，文章 | `fear ol public speaking` | `fear of public speaking` | `f` 被识别为 `l` |
| R011 | C9 Test 3 Passage 1，题目说明 | `claims ol the writer` | `claims of the writer` | `f` 被识别为 `l` |
| R012 | C9 Test 3 Passage 2，文章导语 | `renewable energy for Dritain` | `renewable energy for Britain` | `B` 被识别为 `D` |
| R013 | C9 Test 3 Passage 2，文章 | `lf tide, wind and wave power` | `If tide, wind and wave power` | 大写 `I` 被识别为小写 `l` |
| R014 | C9 Test 3 Passage 2，文章 | `tidal powen` | `tidal power` | `r` 被识别为 `n` |
| R015 | C9 Test 3 Passage 3，文章 | `I0ngest·distance repair job` | `longest-distance repair job` | `o` 被识别为数字 `0`，标点异常 |
| R016 | C9 Test 4 Passage 1，文章 | `Nobel A Prize` | `Nobel Prize` | 多余字符 |
| R017 | C9 Test 4 Passage 1，文章 | `Henri Raeqiierel` | `Henri Becquerel` | 人名 OCR 严重错误 |
| R018 | C9 Test 4 Passage 1，文章 | `the hist woman` | `the first woman` | `f` 被识别为 `h` |
| R019 | C9 Test 4 Passage 1，文章 | `in thc orc` | `in the ore` | 两处 `e` 被识别为 `c` |
| R020 | C9 Test 4 Passage 3，文章 | `role to fullfil` | `role to fulfil` | 单词拼写错误 |
| R021 | C11 Test 2 Passage 2，文章 | `Erich von D?niken` | `Erich von Däniken` | 重音字符损坏 |
| R022 | C11 Test 3 Passage 3，文章 | `even na?ve` | `even naïve` | 重音字符损坏 |
| R023 | C12 Test 3 Passage 3，文章 | `PET and fMRl` | `PET and fMRI` | 大写 `I` 被识别为小写 `l` |
| R024 | C12 Test 4 Passage 1，文章 | `the modem glass industry` | `the modern glass industry` | `rn` 被识别为 `m` |
| R025 | C12 Test 4 Passage 1，文章 | `a modem, hi-tech industry` | `a modern, hi-tech industry` | `rn` 被识别为 `m` |
| R026 | C12 Test 4 Passage 2，文章 | `modern ecoloqy` | `modern ecology` | `g` 被识别为 `q` |
| R027 | C13 Test 4 Passage 1，文章 | `further south tiian` | `further south than` | `h` 被识别为 `ii` |
| R028 | C13 Test 4 Passage 3，文章 | `Modem industrial societies` | `Modern industrial societies` | `rn` 被识别为 `m` |
| R029 | C14 Test 4 Passage 2，文章 | `handling arid transporting animals` | `handling and transporting animals` | `n` 被识别为 `ri` |
| R030 | C16 Test 4 Passage 1，文章 | `a relia ble supply` | `a reliable supply` | 单词被错误拆开 |
| R031 | C18 Test 1 Passage 3，文章 | `'lf you knew precisely` | `'If you knew precisely` | 大写 `I` 被识别为小写 `l` |

## B. 高度疑似，但建议核对原书 PDF

| ID | 位置 | 当前文本 | 建议/核对方向 | 原因 |
| --- | --- | --- | --- | --- |
| R035 | C8 Test 4 Passage 3，文章 | `the number used can from a few` | 很可能是 `the number used can vary from a few` | 疑似漏掉 `vary` |
| R038 | C12 Test 2 Passage 2，文章 | `Machu Picchu was a moya, a country estate...` | `moya` 高度疑似错误，需对照原书确认是否为 `royal retreat`、`royal estate` 或专有术语 | 当前词不符合句意，不能仅靠词典猜改 |
| R039 | C11 Test 4 Passage 3，文章 | `mouth -p,fb,v,t,d,k,g,sh,a,e...` | 核对音素列表及标点 | OCR 把音素间空格/逗号合并 |

## C. 已排除，不应修改

以下类型被机器扫描标记，但属于正确内容：

- 英式拼写：`colour`、`favour`、`organise`、`civilisation`、`odour`、`fibre`、`metres` 等。
- 专有名词：`Kund`、`Baori`、`Marae`、`boda boda`、`Neochetina bruchi/bruci` 等需要对照原书，不按普通词典改写。
- 学术词：`fMRI`、`anthocyanins`、`atavisms`、`Palaeolithic` 等。
- 拉丁语或固定表达：`vice versa`、`ipso facto`。
- 单位和缩写：`kg`、`ml`、`mm`。
- 罗马数字选项：`iv`、`vi`、`vii`、`viii` 等。

## D. 修复后重新扫描发现并已修复的确定错误

| ID | 位置 | 当前文本 | 建议文本 | 类型 |
| --- | --- | --- | --- | --- |
| R041 | C9 Test 1 Passage 3，文章 | `modem land tortoises` | `modern land tortoises` | `rn` 被识别为 `m` |
| R042 | C9 Test 2 Passage 1，文章 | `Modem treading practices` | `Modern teaching practices` | 同一句中包含两处 OCR 错误 |
| R043 | C9 Test 3 Passage 1，文章 | `the modem linguistic approach` | `the modern linguistic approach` | `rn` 被识别为 `m` |

本轮重新扫描的其他高排名结果均属于前述英式拼写、专有名词、单位、罗马数字、带重音字符或 B 类待核内容，没有继续自动修改。

## E. 用户确认后修复的疑似项

| ID | 位置 | 修复前 | 修复后 |
| --- | --- | --- | --- |
| R032 | C7 Test 1 Passage 3，文章 | `those mad through conscious processing` | `those made through conscious processing` |
| R033 | C8 Test 1 Passage 3，文章 | `have risk the derision` | `have risked the derision` |
| R034 | C8 Test 4 Passage 1，文章 | `Lessons last standardised 50 minutes` | `Lessons last a standardised 50 minutes` |
| R036 | C9 Test 3 Passage 1，文章 | `Language, more oven is a very public...` | `Language, moreover, is a very public...` |
| R037 | C9 Test 3 Passage 2，文章 | `identified 1GB potential sites for tidal power BG%` | `identified 106 potential sites for tidal power, 80%` |
| R040 | C9 Test 4 Passage 1，文章 | `Irene and Frédéric Joliot- Curie` | `Irène and Frédéric Joliot-Curie` |

## 审核说明

1. 当前 Reading Markdown 中同一篇文章可能同时出现在原始 JSON、`part_content`、翻译句子和最终正文中。
2. 人工确认后，修复时必须修改所有会被运行时读取或显示的重复字段，不能只改最终正文而留下题目说明/解析中的同一错字。
3. 修改后应重新解析全部 180 个文件，并在对应页面检查文章、题干、选项和答案映射没有被 JSON/YAML 转义破坏。
