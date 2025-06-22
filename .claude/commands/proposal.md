ユーザーから聞いた機能概要を元に、機能提案を作成します。
機能概要:
$ARGUMENTS

以下の手順で進めてください。

1. 機能概要を認識し、現状のコードベースを分析します。
2. 実装機能を検討します。
3. 機能提案を作成します。
   docs/proposals/ 配下にファイルを作成します。  
   statusは draft として作成します。
4. 作成した機能提案をユーザーに提示します。
5. ユーザーから承認が得られたら、statusを approved に変更します。

## 機能提案書のフォーマット

マークダウン形式で作成します。

```
---
status: draft | approved | rejected | done
---

# <機能タイトル>

## Overview
<機能の概要を記述します>

## Current Issues
<現在の問題点を記述します>

## Proposed Solution
<提案する解決策や機能概要を記述します>

## Implementation Plan
### Phase 1: <フェーズ名>
<フェーズ1の実装内容を記述します>

### Phase 2: <フェーズ名>
<フェーズ2の実装内容を記述します>

## Testing Strategy
<テスト戦略を記述します>

## Implementation Priority
<優先度を記述します>

## Conclusion
<機能提案のまとめを記述します>
```
