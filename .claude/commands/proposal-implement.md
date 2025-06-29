提案書の機能を実装してください: ${ARGUMENTS}

## 手順

### Step1. タスクリストの作成

1. 提案書がapprovedになっていることを確認する。
   statusがapprovedでない場合は、実装してはいけません。
   ユーザーに再確認してください。
2. 提案書の内容を確認する。
   提案書の内容を確認し、実装に必要な情報を収集する。
3. 実装計画を作成
   docs/todos/TODO-<機能名>.mdにタスクを記載してください。

TODO-<機能名>.mdの内容は以下のようにしてください。

```markdown
# <機能名> TODO

## 完了したタスク

### タスク1

- [x] タスク1-1
- [x] タスク1-2

## 進行中のタスク

### タスク2

- [x] タスク2-1
- [ ] タスク2-2

## 実施予定のタスク

### タスク3

- [ ] タスク3-1
- [ ] タスク3-2

## メモ

<開発中に気づいたことや、実装に必要な情報を記載してください。>
※コードの詳細の記載は禁止です。
```

### Step2. 実装の進行

4. 実装を開始する。
   提案書とTODO.mdに基づいて、実装を開始してください。
5. 実装中は、進捗状況を定期的に確認し、必要に応じてTODO.mdを更新してください。

### Step3. 実装の完了

5. 実装が完了したら、開発ルールに基づき品質を確認してください。
6. 関連ドキュメントを更新してください。
   - README.md
   - docs/\*.md
