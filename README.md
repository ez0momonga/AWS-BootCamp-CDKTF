# AWS Workshop CDKTF

このプロジェクトは、AWS CDKTFを使ってAWSリソースをデプロイするワークショップ用のプロジェクトです。

## 前提条件

以下のツールがインストールされている必要があります：

- Node.js（バージョン20.9以上）
- npm または yarn
- AWS CLI（設定済み）
- Terraform CLI

### 必要なツールのインストール（Mac）

Homebrewを使用して必要なツールをインストールします：

```bash
# AWS CLIのインストール
brew install awscli

# Terraform CLIのインストール
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

### AWS 認証設定

推奨：AWS SSOを使用
```bash
# AWS SSO でログイン
aws sso login

# プロファイルを指定してログインする場合
aws sso login --profile develop

# 設定確認
aws sts get-caller-identity
```

> **注意**: プロファイル名（`develop`など）は事前にAWS CLI設定ファイル（`~/.aws/config`）で設定されている必要があります。

AWS プロファイルを使用する場合は環境変数で指定：
```bash
# AWS プロファイルを指定（SSOを使用する場合）
export AWS_PROFILE=develop
```

<details>
<summary>🔧 初心者向け：従来のAWS CLI設定方法（オプション）</summary>

SSOを使用しない場合の従来の設定方法：

```bash
# 対話型で設定
aws configure
```

または環境変数で設定：
```bash
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
export AWS_DEFAULT_REGION=ap-northeast-1
```

</details>

## プロジェクトのセットアップ

### 1. プロジェクトのクローン

```bash
git clone <repository-url>
cd cdktf
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境設定ファイルの作成

`.env.sample`を参考にして、`.env`ファイルを作成してください：

```bash
cp .env.sample .env
```

`.env`ファイルを開いて、必要な設定値を記入してください。

### 4. Terraformプロバイダーの取得

```bash
npm run get
```



## 基本的な使い方

### コードの開発とテスト

#### 1. ファイルの監視とコンパイル

開発中は、ファイルの変更を監視して自動コンパイルできます：

```bash
npm run watch
```

#### 2. コードのテスト

```bash
npm run test
```

テストをリアルタイムで実行：

```bash
npm run test:watch
```

#### 3. コードの品質管理

**コードの書式設定：**
```bash
npm run format
```
Prettierを使用してコードを自動整形します。

**リンティング（コードチェック）：**
```bash
npm run lint
```
ESLintを使用してコードの問題を自動修正します。

**リンティングのチェックのみ（修正なし）：**
```bash
npm run lint:check
```
コードの問題を確認するだけで、自動修正は行いません。CIでの使用に適しています。

### インフラストラクチャの管理

#### 1. 設定の合成（Synthesize）

Terraformの設定ファイルを生成します：

```bash
npx cdktf synth
```

#### 2. プランの確認

デプロイ前に変更内容を確認：

```bash
npx cdktf plan
```

または

```bash
npm run plan
```

#### 3. デプロイ（Apply）

**注意：実際のAWSリソースが作成され、課金が発生する可能性があります。**

```bash
npx cdktf deploy
```

デプロイ時の確認プロンプトで `yes` を入力してください。

特定のスタックのみデプロイする場合：

```bash
npx cdktf deploy [stack-name]
```

#### 4. 変更の確認（Diff）

現在のインフラと設定の差分を確認：

```bash
npx cdktf diff
```

特定のスタックの差分を確認：

```bash
npx cdktf diff [stack-name]
```

#### 5. リソースの削除（Destroy）

**警告：この操作により、デプロイされたすべてのAWSリソースが削除されます。**

```bash
npx cdktf destroy
```

確認プロンプトで `yes` を入力してください。

特定のスタックのみ削除：

```bash
npx cdktf destroy [stack-name]
```

## 開発用コマンド一覧

### コード品質管理

| コマンド | 説明 |
|---------|--------|
| `npm run format` | Prettierでコードを自動整形 |
| `npm run lint` | ESLintでコードの問題をチェック・修正 |
| `npm run lint:check` | ESLintでコードの問題をチェックのみ（修正なし） |

### 開発サポート

| コマンド | 説明 |
|---------|--------|
| `npm run watch` | ファイル変更を監視して自動コンパイル |

### テスト

| コマンド | 説明 |
|---------|--------|
| `npm test` | Jestでユニットテストを実行 |
| `npm run test:watch` | テストをリアルタイムで監視・実行 |

### CDKTF管理

| コマンド | 説明 |
|---------|--------|
| `npm run get` | Terraformプロバイダーを取得・更新 |
| `npm run synth` | cdktf synthのエイリアス |
| `npm run plan` | cdktf planのエイリアス |

## トラブルシューティング

### よくあるエラー

1. **AWS認証エラー**
   - AWS CLIが正しく設定されているか確認
   - 適切なIAM権限があるか確認

2. **Terraform初期化エラー**
   ```bash
   npx cdktf get
   ```

3. **TypeScriptコンパイルエラー**
   ```bash
   npm run build
   ```

### 助けが必要な場合

```bash
cat help
```

## 注意事項

- **課金について**：このプロジェクトをデプロイすると、AWSで課金が発生する可能性があります
- **リソースの削除**：不要になったら必ず `cdktf destroy` でリソースを削除してください
- **権限について**：適切なIAM権限が設定されていることを確認してください

## 参考リンク

- [CDKTF ドキュメント](https://cdk.tf/)
- [AWS CDK for Terraform](https://docs.aws.amazon.com/cdk/api/v2/)
- [Terraform AWS プロバイダー](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
