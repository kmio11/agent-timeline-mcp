# Multi-Session Support TODO

## 完了したタスク

### 実装計画

- [x] 提案書の内容確認（status: approved）
- [x] 実装計画の作成
- [x] TODOファイルの作成

### Phase 1: Core Session Management Refactoring

- [x] postTimeline.tsのcurrentSessionId除去とsession_id必須化
- [x] session.tsの拡張 - getOrCreateAgentByIdentity関数追加
- [x] database.tsの拡張 - getAgentByIdentityKey関数追加
- [x] index.tsからsetCurrentSession関数の使用を除去

### Phase 2: Database Schema Enhancement

- [x] データベースインデックス最適化
- [x] セッション検索パフォーマンス向上

### Phase 3: MCP Tool Interface Updates

- [x] signOut.tsのsession_id必須化
- [x] エラーハンドリング強化
- [x] shared/types.tsのタイプ定義更新

### Testing & Quality Assurance

- [x] ユニットテストの実装（23テスト作成）
- [x] session.test.ts - セッション管理テスト
- [x] postTimeline.test.ts - 投稿機能テスト
- [x] signOut.test.ts - サインアウト機能テスト
- [x] 品質チェック実行 (lint, typecheck, build, test)

### Documentation Updates

- [x] README.md - マルチセッション対応のAPI使用例更新
- [x] docs/api-specification.md - API仕様の更新（session_id必須化）
- [x] docs/architecture.md - アーキテクチャドキュメントの更新
- [x] CLAUDE.md - AI Agent Experience Principlesの更新

## 実施予定のタスク

### Phase 3: 残りタスク（低優先度）

- [ ] signIn.tsのレスポンス改善

## 実装済みのタスク

### shared/types.ts 型定義の追加・改善

- [x] MCPツール入力パラメータ型（SignInParams、PostTimelineParams、SignOutParams）
- [x] セッション検証結果型（SessionValidationResult）
- [x] マルチセッション状態管理型（MultiSessionState）
- [x] ランタイム型ガード関数（isSignInParams、isPostTimelineParams、isSignOutParams）
- [x] 型安全性向上（MCPToolName、ErrorCode型）
- [x] constants.tsとの重複排除・統合

## メモ

### 実装のポイント

- グローバルcurrentSessionIdを完全に除去し、session_idパラメータによる明示的なセッション管理に移行
- 同一identity_keyでの複数回サインイン時に同一agent_idを再利用する仕組み実装
- 既存機能の互換性維持に注意
- 型安全性を向上させるランタイム型ガード関数を追加

### 主要変更ファイル

- mcp-server/src/tools/postTimeline.ts
- mcp-server/src/tools/signIn.ts
- mcp-server/src/tools/signOut.ts
- mcp-server/src/session.ts
- mcp-server/src/database.ts
- shared/types.ts

### 段階的実装方針

1. Phase 1で基本的なセッション管理機能を実装
2. Phase 2でパフォーマンス最適化
3. Phase 3でUI/UX改善と詳細なエラーハンドリング

### 型安全性の改善

- MCPツールパラメータの型定義を明確化
- ランタイム型ガード関数でパラメータ検証を強化
- constants.tsとtypes.tsの重複を排除し、保守性を向上
