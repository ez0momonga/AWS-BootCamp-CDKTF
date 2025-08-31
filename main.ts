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
      defaultTags: [
        {
          tags: {
            Project: 'aws-workshop',
            ManagedBy: 'cdktf',
            Environment: identifier,
          },
        },
      ],
    });

    // 基本的な出力例（後のフェーズで拡張）
    new TerraformOutput(this, 'identifier', {
      value: identifier,
      description: 'Environment identifier used for resource naming',
    });
  }
}

const app = new App();
new AwsWorkshopStack(app, 'aws-workshop-stack', {
  identifier: process.env['ENVIRONMENT_IDENTIFIER'],
});

app.synth();
