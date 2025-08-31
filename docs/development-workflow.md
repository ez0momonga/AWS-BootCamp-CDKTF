# Development Workflow - 細かいgit管理

## 基本ワークフロー

### 1. 変更前の確認
```bash
git status
git diff
```

### 2. コード変更後の検証手順
```bash
# TypeScript型チェック
npm run compile

# ESLintチェック  
npm run lint

# CDKTF synthesis
npm run synth

# Terraform plan検証
npx cdktf plan
```

### 3. 問題なければコミット
```bash
git add .
git commit -m "適切なコミットメッセージ"
```

## コミット単位の指針

### ✅ 推奨する細かいコミット単位
- 1つのリソース追加
- 1つのバグ修正
- 1つの設定変更
- 1つのドキュメント追加・更新
- ESLint設定変更
- TypeScript設定変更

### ❌ 避けるべき大きなコミット
- 複数リソースの同時追加
- 複数の課題を含む変更
- 検証なしの大量変更

## コミットメッセージ規則

### 形式
```
<type>: <subject>

<body>

🚀 Generated with CDKTF
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Type一覧
- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `docs`: ドキュメント
- `style`: フォーマット
- `test`: テスト
- `chore`: 雑務

## 例: VPC作成の場合

### Step 1: VPC基本設定
```bash
# VPC作成
git add main.ts
npm run compile && npm run lint && npx cdktf plan
git commit -m "feat: Add VPC with DNS support

- CIDR: 10.0.0.0/16
- DNS hostname/support enabled
- Basic VPC infrastructure

🚀 Generated with CDKTF"
```

### Step 2: サブネット追加
```bash
# パブリックサブネット追加
git add main.ts
npm run compile && npm run lint && npx cdktf plan  
git commit -m "feat: Add public subnets across 2 AZs

- PublicSubnet1: 10.0.1.0/24 (AZ-a)
- PublicSubnet2: 10.0.2.0/24 (AZ-b)
- Auto-assign public IP enabled

🚀 Generated with CDKTF"
```

### Step 3: プライベートサブネット
```bash
git add main.ts
npm run compile && npm run lint && npx cdktf plan
git commit -m "feat: Add private subnets across 2 AZs

- PrivateSubnet1: 10.0.3.0/24 (AZ-a)  
- PrivateSubnet2: 10.0.4.0/24 (AZ-b)
- No public IP assignment

🚀 Generated with CDKTF"
```

## 現在のプロジェクトへの適用

今後の変更は以下の手順で行います：

1. **小さな単位で変更**
2. **毎回検証** (`compile` → `lint` → `synth` → `plan`)
3. **詳細なコミットメッセージ**
4. **1コミット1機能**

これにより、問題発生時の原因特定が容易になり、変更履歴の追跡が正確になります。