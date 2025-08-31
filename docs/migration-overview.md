# CDK to CDKTF Migration Overview

## プロジェクト概要

このドキュメントは、AWS CDKで実装されたALB + ECSワークショップのインフラストラクチャをCDKTF (Terraform CDK)に移行するためのガイドです。

## 移行対象のアーキテクチャ

### 現在のCDK実装
```
Internet Gateway
       ↓
   Public Subnets (Multi-AZ)
       ↓
Application Load Balancer
       ↓
   Private Subnets (Multi-AZ)
       ↓
    ECS Cluster
  (Fargate Tasks)
```

### 含まれるAWSリソース
- **VPC**: カスタムVPC (10.0.0.0/16)
- **サブネット**: パブリック×2、プライベート×2（マルチAZ構成）
- **ALB**: Application Load Balancer
- **ECS**: Fargate クラスターとサービス
- **ECR**: コンテナレジストリ
- **セキュリティグループ**: ALB用、ECS用
- **IAM**: タスク実行ロール、タスクロール

## 移行の方針

### 1. 段階的移行
- フェーズごとに分割して実施
- 各フェーズで動作確認を実施
- ドキュメント更新を並行実施

### 2. 機能等価性の維持
- 同じAWSリソースの作成
- 同じセキュリティ設定
- 同じネットワーク構成

### 3. 詳細ドキュメント化
- 各リソースの移行手順
- 設定差分の説明
- トラブルシューティング情報

## ファイル構成

```
cdktf/
├── docs/
│   ├── migration-overview.md          # このファイル
│   ├── migration-progress.md          # 進捗管理
│   ├── phase-1-environment.md         # Phase 1: 環境設定
│   ├── phase-2-network.md            # Phase 2: ネットワーク
│   ├── phase-3-security.md           # Phase 3: セキュリティ
│   ├── phase-4-loadbalancer.md       # Phase 4: ロードバランサー
│   ├── phase-5-containers.md         # Phase 5: コンテナ
│   ├── phase-6-testing.md            # Phase 6: テストと検証
│   ├── cdk-cdktf-mappings.md         # リソース対応表
│   └── troubleshooting.md            # トラブルシューティング
├── main.ts                           # メインスタック
└── package.json
```

## 次のステップ

1. **Phase 1**: 環境設定とプロバイダー設定 → `docs/phase-1-environment.md`
2. **Phase 2**: ネットワークインフラの移行 → `docs/phase-2-network.md`
3. **Phase 3**: セキュリティグループの移行 → `docs/phase-3-security.md`

詳細な手順については、各フェーズのドキュメントを参照してください。