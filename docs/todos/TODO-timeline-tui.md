# Timeline TUI TODO

## 完了したタスク

### 準備作業

- [x] 提案書の承認確認
- [x] 実装計画の策定
- [x] TODO管理ドキュメント作成

## 進行中のタスク

### Phase 2: Timeline Functionality

- [ ] Timeline API エンドポイント統合
- [ ] SSE接続によるリアルタイム更新
- [ ] Post コンポーネントとエージェント識別
- [ ] ターミナル向け無限スクロール機能
- [ ] エージェントフィルタリング機能

### Phase 1: Core TUI Infrastructure (完了)

- [x] timeline-tuiパッケージのセットアップ
- [x] React Inkの基本設定とTypeScript統合
- [x] 基本レイアウトコンポーネント実装 (App, Header, Footer)
- [x] 共有型の統合とES Module対応
- [x] 基本的なキーボードナビゲーション
- [x] EventSource polyfill 統合
- [x] React 18 互換性確保

## 実施予定のタスク

### Phase 3: Advanced Features

- [ ] キーボードショートカットとvim風ナビゲーション
- [ ] 接続ステータス監視
- [ ] ターミナル設定システム
- [ ] エクスポート/ログ機能
- [ ] 長時間セッション向けパフォーマンス最適化

### Phase 4: Polish and Integration

- [ ] 包括的エラーハンドリング
- [ ] ヘルプシステムとキーボードショートカット参照
- [ ] インストールと使用方法ドキュメント
- [ ] 既存MCPサーバーとの統合テスト
- [ ] 各種ターミナル環境でのパフォーマンス最適化

### 品質確認

- [ ] ESLint/TypeScript チェック (pnpm check)
- [ ] ビルドテスト (pnpm build)
- [ ] 単体テスト作成と実行
- [ ] E2Eテスト (実際のMCP統合)
- [ ] 複数ターミナル環境での動作確認

### ドキュメント更新

- [ ] README.md にtimeline-tui情報追加
- [ ] package.json ワークスペース設定
- [ ] CLAUDE.md の開発ルール確認

## メモ

### 技術的考慮事項

- React Ink v4系を使用予定
- 既存timeline-guiのAPIサービス層を再利用
- /shared パッケージの型定義を活用
- ES Module形式での実装が必要

### 開発上の注意点

- timeline-guiの実装パターンを参考にする
- SSE接続は既存の /api/events エンドポイントを使用
- 品質ゲート (pnpm check, pnpm build) を必ず通す
- 実際のデータフローでのテストを重視する

### 依存関係

- ink: React TUI ライブラリ
- @types/react: TypeScript型定義
- 既存shared パッケージとの統合
- timeline-gui の API サービス層参照