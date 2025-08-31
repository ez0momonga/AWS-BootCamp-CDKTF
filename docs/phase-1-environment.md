# Phase 1: Environment Setup and Provider Configuration

## 目標
CDKTFプロジェクトの基本環境を整備し、AWS Providerを正しく設定する。

## 前提条件
- Node.js >= 20.9 がインストール済み
- AWS CLI が設定済み（認証情報含む）
- cdktf-cli がインストール済み

## 作業手順

### Step 1: プロジェクト依存関係の確認

```bash
cd /Users/momonga/Documents/AWS-Workshop/cdktf
npm list
```

現在の状態を確認し、必要なパッケージが正しくインストールされているか確認。

### Step 2: AWS Provider バインディングの生成

```bash
npm run get
```

このコマンドにより `.gen/providers/aws/` ディレクトリにTypeScriptバインディングが生成される。

### Step 3: 基本的なAWS Provider設定の実装

現在の `main.ts`:
```typescript
import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from './.gen/providers/aws/provider';

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, 'aws', {
      region: 'ap-northeast-1',
    });

    // define resources here
  }
}

const app = new App();
new MyStack(app, 'AWS-Workshop-cdktf');
app.synth();
```

### Step 4: CDK設定の分析

CDKプロジェクトの設定を確認：
- Region: `ap-northeast-1`（東京リージョン）
- Identifier機能: デフォルト値'default'で環境識別

### Step 5: CDKTFスタックの改良

以下の要素を追加実装：
1. 環境識別子の対応
2. CDKと同等のスタック構成
3. 適切なタグ付け戦略

### Step 6: コード品質チェック

```bash
npm run lint
npm run compile
npm run test
```

全てのチェックが通ることを確認。

### Step 7: 初回synthesis確認

```bash
npm run synth
```

正常にTerraform設定ファイルが生成されることを確認。

## 実装内容

### 改良された main.ts の構成案

```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from './.gen/providers/aws/provider';

interface AwsWorkshopStackProps {
  readonly identifier?: string;
}

class AwsWorkshopStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: AwsWorkshopStackProps) {
    super(scope, id);

    // デフォルト値として'default'を使用、環境変数または引数で上書き可能
    const identifier = props?.identifier || 'default';

    // AWS Provider設定
    new AwsProvider(this, 'aws', {
      region: 'ap-northeast-1',
      
      // Optional: プロバイダーレベルのタグ設定
      defaultTags: [{
        tags: {
          Project: 'aws-workshop',
          ManagedBy: 'cdktf',
          Environment: identifier
        }
      }]
    });

    // 基本的な出力例（後のフェーズで拡張）
    new TerraformOutput(this, 'identifier', {
      value: identifier,
      description: 'Environment identifier used for resource naming'
    });
  }
}

const app = new App();
new AwsWorkshopStack(app, 'aws-workshop-stack', {
  identifier: process.env.ENVIRONMENT_IDENTIFIER
});

app.synth();
```

## 検証ポイント

### ✅ 成功基準
- [ ] `npm run get` でプロバイダーバインディング生成成功
- [ ] `npm run lint` エラーなし
- [ ] `npm run compile` エラーなし  
- [ ] `npm run synth` で Terraform ファイル生成成功
- [ ] `cdktf.out/stacks/aws-workshop-stack/` にファイルが生成される

### ⚠️ 注意点
- `.gen/` ディレクトリは自動生成されるため、直接編集しない
- AWS認証情報が正しく設定されていることを確認
- リージョンは必ず `ap-northeast-1` を使用

## 次のステップ

Phase 1完了後、Phase 2（ネットワークインフラ移行）に進む。
詳細は `docs/phase-2-network.md` を参照。

## トラブルシューティング

### Provider generation エラー
```bash
# キャッシュクリアしてリトライ
rm -rf .gen/
npm run get
```

### TypeScript コンパイルエラー
```bash
# 型定義確認
npm run compile -- --listFiles
```