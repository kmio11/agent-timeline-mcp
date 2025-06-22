# Multi-Session Support TODO

## 完了したタスク

### 実装計画
- [x] 提案書の内容確認（status: approved）
- [x] 実装計画の作成
- [x] TODOファイルの作成

## 進行中のタスク

### Phase 1: Core Session Management Refactoring
- [ ] postTimeline.tsのcurrentSessionId除去とsession_id必須化
- [ ] session.tsの拡張 - getOrCreateAgentByIdentity関数追加  
- [ ] database.tsの拡張 - getAgentByIdentityKey関数追加

## 実施予定のタスク

### Phase 2: Database Schema Enhancement
- [ ] データベースインデックス最適化
- [ ] agents.identity_keyにユニークインデックス追加
- [ ] セッション検索パフォーマンス向上

### Phase 3: MCP Tool Interface Updates
- [ ] signIn.tsのレスポンス改善
- [ ] signOut.tsのsession_id必須化
- [ ] shared/types.tsのタイプ定義更新
- [ ] エラーハンドリング強化

### Testing & Quality Assurance
- [ ] ユニットテストの実装
- [ ] 統合テストの実装
- [ ] E2Eテストの実装
- [ ] 品質チェック実行 (pnpm check, build, test)

## メモ

### 実装のポイント
- グローバルcurrentSessionIdを完全に除去し、session_idパラメータによる明示的なセッション管理に移行
- 同一identity_keyでの複数回サインイン時に同一agent_idを再利用する仕組み実装
- 既存機能の互換性維持に注意

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