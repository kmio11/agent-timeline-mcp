# agent-timeline-mcp エンハンス TODO

## 完了したタスク

### Timeline GUI ポーリング廃止とプッシュ通知対応 - 実装完了 ✅

#### Phase 1: サーバー側実装 ✅
- [x] Go server に Server-Sent Events (SSE) エンドポイント追加 (`/api/events`)
- [x] PostgreSQL LISTEN/NOTIFY を使用した新規投稿検知システム（Go server内で完結）
- [x] データベーストリガー実装（投稿INSERT時にNOTIFY発行）
- [x] Go server での PostgreSQL 通知リスナー実装
- [x] SSE 接続管理とブロードキャスト機能
- [x] メモリリーク修正（keepalive timer の適切な管理）

#### Phase 2: クライアント側実装 ✅
- [x] ポーリング機能廃止 (useTimelinePolling.ts → useSSETimeline.ts)
- [x] SSE クライアント実装 (EventSource API)
- [x] 更新ボタンに新規投稿件数バッジ表示
- [x] 自動更新オン/オフ切り替えボタン実装

#### Phase 3: UI/UX 改善 ✅
- [x] 新規投稿通知の視覚的フィードバック（バッジとボタン状態）
- [x] 手動更新時の新規投稿取得機能
- [x] 自動更新有効時の即座反映機能
- [x] エラーハンドリングとフォールバック機能
- [x] 接続状態インジケータ改善

#### Phase 4: テスト・品質保証 ✅
- [x] TypeScript型チェック完了
- [x] ESLint品質チェック完了  
- [x] ビルドテスト完了
- [x] Go server コンパイル確認
- [x] E2Eテスト実行・動作確認完了
- [x] PostgreSQL通知システム修正（タイムスタンプフォーマット）

#### Phase 5: UI/UX追加改善 ✅
- [x] Auto/Manual切り替えUIをスイッチに変更
- [x] 状態表示の明確化（現在の設定が一目でわかる）
- [x] アクセシビリティ向上（aria-label、ラベル要素）
- [x] shadcn/ui Switch コンポーネント導入

## 進行中のタスク
なし

## 実施予定のタスク
なし

### テスト

- [ ] Golang Serverのユニットテスト追加

## 未整理

タスク化がされていない未整理のメモ。

- MCPサーバーをGolang SDKに移行する。  
  https://github.com/orgs/modelcontextprotocol/discussions/364
- GUIのリアルタイム更新。
- CLAUDE.mdの整理
- Claudeセッション、Gitコミットとの紐づけ
- ビルドスクリプト
- README.mdのビルド手順が誤り（Goのビルドがない）
- マルチセッションサポート。1つのMCPサーバーで複数のセッションをサポートする。
- Notificationのリファクタ。databaseパッケージへの移動。
