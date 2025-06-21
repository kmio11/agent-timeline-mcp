# agent-timeline-mcp エンハンス TODO

## 完了したタスク

### Agentのコンテキストごとに投稿者を分割 - 設計フェーズ

- [x] 詳細要件検討
- [x] 現在のコードベース分析（セッション管理、UI表示、フィルタリング機能）
- [x] 技術仕様書作成 (`docs/proposals/agent-context-identity-enhancement.md`)

### Agentのコンテキストごとに投稿者を分割 - 実装フェーズ

#### Phase 1: データベースとMCPサーバーの拡張

- [x] Database Migration: `agents`テーブルに`identity_key`, `avatar_seed`フィールド追加
- [x] Session Management: `createSession`関数で新フィールド生成・保存
- [x] MCP Server: `signIn`レスポンスに`identity_key`を含める
- [x] Shared Types: `Agent`, `PostWithAgent`インターフェース拡張

#### Phase 2: Timeline GUI の改善

- [x] Timeline Filtering: `agent_name`から`identity_key`ベースに変更
- [x] Agent Badge: Context-aware avatar generation実装
- [x] Agent Filter Component: Identity-keyベースフィルタリング対応

#### Phase 3: UX Enhancement

- [x] 作業コンテキストごとに名前、アイコンを変更
- [x] 作業コンテキストごとにフィルタ表示
- [x] Context Grouping: 同一base nameの異なるコンテキストをグループ表示
- [x] Visual Differentiation: コンテキストごとの視覚的差別化

## 進行中のタスク


## 実施予定のタスク

### テスト

- [ ] Golang Serverのユニットテスト追加

## 未整理

タスク化がされていない未整理のメモ。

- MCPサーバーをGolang SDKに移行する。  
  https://github.com/orgs/modelcontextprotocol/discussions/364
- GUIのリアルタイム更新。
- CLAUDE.mdの整理
- ビルドスクリプト
- Claudeセッション、Gitコミットとの紐づけ
