import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from './.gen/providers/aws/provider';
import { Vpc } from './.gen/providers/aws/vpc';
import { Subnet } from './.gen/providers/aws/subnet';
import { InternetGateway } from './.gen/providers/aws/internet-gateway';
import { RouteTable } from './.gen/providers/aws/route-table';
import { Route } from './.gen/providers/aws/route';
import { RouteTableAssociation } from './.gen/providers/aws/route-table-association';
import { NatGateway } from './.gen/providers/aws/nat-gateway';
import { Eip } from './.gen/providers/aws/eip';
import { DataAwsAvailabilityZones } from './.gen/providers/aws/data-aws-availability-zones';
import { SecurityGroup } from './.gen/providers/aws/security-group';
import { SecurityGroupRule } from './.gen/providers/aws/security-group-rule';
import { Lb } from './.gen/providers/aws/lb';
import { LbTargetGroup } from './.gen/providers/aws/lb-target-group';
import { LbListener } from './.gen/providers/aws/lb-listener';
import { EcrRepository } from './.gen/providers/aws/ecr-repository';
import { EcsCluster } from './.gen/providers/aws/ecs-cluster';
import { EcsClusterCapacityProviders } from './.gen/providers/aws/ecs-cluster-capacity-providers';
import { IamRole } from './.gen/providers/aws/iam-role';
import { IamRolePolicyAttachment } from './.gen/providers/aws/iam-role-policy-attachment';
import { EcsTaskDefinition } from './.gen/providers/aws/ecs-task-definition';
import { EcsService } from './.gen/providers/aws/ecs-service';
import { DataAwsIamPolicyDocument } from './.gen/providers/aws/data-aws-iam-policy-document';
import { CloudwatchLogGroup } from './.gen/providers/aws/cloudwatch-log-group';
import { IamPolicy } from './.gen/providers/aws/iam-policy';

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

    // ===========================================
    // VPC作成
    // ===========================================
    // アベイラビリティゾーン取得
    const availabilityZones = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // VPC（Virtual Private Cloud）を作成
    const vpc = new Vpc(this, 'workshop-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'WorkshopVpc',
      },
    });

    // ===========================================
    // サブネット作成
    // ===========================================
    // パブリックサブネット 1
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.0.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[0]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: 'PublicSubnet1',
        Type: 'Public',
      },
    });

    // パブリックサブネット 2
    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[1]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: 'PublicSubnet2',
        Type: 'Public',
      },
    });

    // プライベートサブネット 1
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[0]}`,
      mapPublicIpOnLaunch: false,
      tags: {
        Name: 'PrivateSubnet1',
        Type: 'Private',
      },
    });

    // プライベートサブネット 2
    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[1]}`,
      mapPublicIpOnLaunch: false,
      tags: {
        Name: 'PrivateSubnet2',
        Type: 'Private',
      },
    });

    // ===========================================
    // インターネットゲートウェイ
    // ===========================================
    const internetGateway = new InternetGateway(this, 'internet-gateway', {
      vpcId: vpc.id,
      tags: {
        Name: 'WorkshopIgw',
      },
    });

    // ===========================================
    // Elastic IP（NAT Gateway用）
    // ===========================================
    const natEip1 = new Eip(this, 'nat-eip-1', {
      domain: 'vpc',
      tags: {
        Name: 'NatEip1',
      },
      dependsOn: [internetGateway],
    });

    const natEip2 = new Eip(this, 'nat-eip-2', {
      domain: 'vpc',
      tags: {
        Name: 'NatEip2',
      },
      dependsOn: [internetGateway],
    });

    // ===========================================
    // NAT Gateway
    // ===========================================
    const natGateway1 = new NatGateway(this, 'nat-gateway-1', {
      allocationId: natEip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: 'NatGateway1',
      },
      dependsOn: [internetGateway],
    });

    const natGateway2 = new NatGateway(this, 'nat-gateway-2', {
      allocationId: natEip2.id,
      subnetId: publicSubnet2.id,
      tags: {
        Name: 'NatGateway2',
      },
      dependsOn: [internetGateway],
    });

    // ===========================================
    // ルートテーブル
    // ===========================================
    // パブリックルートテーブル
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: 'PublicRouteTable',
      },
    });

    // パブリックルート（インターネットゲートウェイへ）
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    // パブリックサブネットの関連付け
    new RouteTableAssociation(this, 'public-subnet-1-association', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-subnet-2-association', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // プライベートルートテーブル 1
    const privateRouteTable1 = new RouteTable(this, 'private-route-table-1', {
      vpcId: vpc.id,
      tags: {
        Name: 'PrivateRouteTable1',
      },
    });

    // プライベートルート 1（NAT Gateway 1へ）
    new Route(this, 'private-route-1', {
      routeTableId: privateRouteTable1.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway1.id,
    });

    // プライベートサブネット 1の関連付け
    new RouteTableAssociation(this, 'private-subnet-1-association', {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable1.id,
    });

    // プライベートルートテーブル 2
    const privateRouteTable2 = new RouteTable(this, 'private-route-table-2', {
      vpcId: vpc.id,
      tags: {
        Name: 'PrivateRouteTable2',
      },
    });

    // プライベートルート 2（NAT Gateway 2へ）
    new Route(this, 'private-route-2', {
      routeTableId: privateRouteTable2.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway2.id,
    });

    // プライベートサブネット 2の関連付け
    new RouteTableAssociation(this, 'private-subnet-2-association', {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable2.id,
    });

    // ===========================================
    // CloudFormation アウトプット（VPC情報）
    // ===========================================
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnets', {
      value: [publicSubnet1.id, publicSubnet2.id].join(','),
      description: 'Public Subnet IDs',
    });

    new TerraformOutput(this, 'private-subnets', {
      value: [privateSubnet1.id, privateSubnet2.id].join(','),
      description: 'Private Subnet IDs',
    });

    // ===========================================
    // セキュリティグループ作成
    // ===========================================

    // ALB（Application Load Balancer）用セキュリティグループ
    // インターネットからのHTTP/HTTPSアクセスを許可
    const albSecurityGroup = new SecurityGroup(this, 'alb-security-group', {
      namePrefix: `${identifier}-alb-sg-`,
      vpcId: vpc.id,
      description: 'Security group for Application Load Balancer',
      tags: {
        Name: 'AlbSecurityGroup',
      },
    });

    // インバウンドルール：HTTP（ポート80）を全てのIPから許可
    new SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'], // 0.0.0.0/0（全てのIPアドレス）
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTP traffic',
    });

    // インバウンドルール：HTTPS（ポート443）を全てのIPから許可
    new SecurityGroupRule(this, 'alb-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'], // 0.0.0.0/0（全てのIPアドレス）
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTPS traffic',
    });

    // アウトバウンドルール：全て許可（デフォルト）
    new SecurityGroupRule(this, 'alb-all-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // ECS（Elastic Container Service）用セキュリティグループ
    // ALBからのトラフィックのみ許可（セキュリティ強化）
    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-security-group', {
      namePrefix: `${identifier}-ecs-sg-`,
      vpcId: vpc.id,
      description: 'Security group for ECS containers',
      tags: {
        Name: 'EcsSecurityGroup',
      },
    });

    // インバウンドルール：ALBからのRails serverアクセスのみ許可
    // セキュリティグループ同士を参照することで、ALBからの通信のみ許可
    new SecurityGroupRule(this, 'ecs-app-ingress', {
      type: 'ingress',
      fromPort: 3000,
      toPort: 3000,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id, // ソースとしてALBのセキュリティグループを指定
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow traffic from ALB to Rails server',
    });

    // アウトバウンドルール：全て許可（コンテナがインターネットアクセス可能）
    new SecurityGroupRule(this, 'ecs-all-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // ===========================================
    // CloudFormation アウトプット（セキュリティグループ情報）
    // ===========================================
    new TerraformOutput(this, 'alb-security-group-id', {
      value: albSecurityGroup.id,
      description: 'ALB Security Group ID',
    });

    new TerraformOutput(this, 'ecs-security-group-id', {
      value: ecsSecurityGroup.id,
      description: 'ECS Security Group ID',
    });

    // ===========================================
    // Application Load Balancer (ALB) 作成
    // ===========================================
    // インターネット向けのApplication Load Balancerを作成
    // - パブリックサブネットに配置してインターネットからアクセス可能
    // - 複数のアベイラビリティゾーンにまたがって高可用性を確保
    // - 作成したALB用セキュリティグループを適用
    const alb = new Lb(this, 'workshop-alb', {
      name: `workshop-alb-${identifier}`,
      loadBalancerType: 'application',
      internal: false, // インターネット向けALB（パブリックサブネットに配置）
      subnets: [publicSubnet1.id, publicSubnet2.id], // パブリックサブネットを指定（複数AZで高可用性）
      securityGroups: [albSecurityGroup.id], // 作成済みのALB用セキュリティグループを適用
      enableDeletionProtection: false, // 削除保護を無効化（ワークショップ用途のため）
      tags: {
        Name: 'WorkshopAlb',
      },
    });

    // ===========================================
    // ターゲットグループ作成
    // ===========================================
    // ALBがリクエストを転送する先のターゲットグループを作成
    // ECSサービスがこのターゲットグループにタスクを登録する
    const targetGroup = new LbTargetGroup(this, 'workshop-target-group', {
      name: `workshop-tg-${identifier}`,
      // ターゲットタイプをIPアドレスに設定（ECS Fargateで使用）
      targetType: 'ip',
      // 使用するポート番号（Rails serverのリスニングポート）
      port: 3000,
      // プロトコル設定
      protocol: 'HTTP',
      // VPCを指定
      vpcId: vpc.id,

      // ヘルスチェック設定
      healthCheck: {
        enabled: true,
        path: '/', // ヘルスチェック用のパス（コンテナのヘルスチェックエンドポイント）
        protocol: 'HTTP', // ヘルスチェックのプロトコル
        interval: 30, // ヘルスチェックの間隔（秒）
        timeout: 5, // タイムアウト時間（秒）
        healthyThreshold: 2, // 正常判定に必要な連続成功回数
        unhealthyThreshold: 3, // 異常判定に必要な連続失敗回数
        matcher: '200', // 正常応答として期待するHTTPステータスコード
      },
      tags: {
        Name: 'WorkshopTargetGroup',
      },
    });

    // ===========================================
    // ALBリスナー作成
    // ===========================================
    // ALBがリクエストを受信した際の処理を定義
    // HTTP（ポート80）でリクエストを受信し、ターゲットグループに転送
    new LbListener(this, 'workshop-listener', {
      loadBalancerArn: alb.arn,
      // リスニングポート
      port: 80,
      // プロトコル
      protocol: 'HTTP',

      // デフォルトアクション：全てのリクエストをターゲットグループに転送
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      tags: {
        Name: 'WorkshopListener',
      },
    });

    // ===========================================
    // CloudFormation アウトプット（ALB情報）
    // ===========================================
    new TerraformOutput(this, 'alb-arn', {
      value: alb.arn,
      description: 'ALB ARN',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: alb.dnsName,
      description: 'ALB DNS Name (Access URL)',
    });

    new TerraformOutput(this, 'target-group-arn', {
      value: targetGroup.arn,
      description: 'Target Group ARN',
    });

    new TerraformOutput(this, 'alb-url', {
      value: `http://${alb.dnsName}`,
      description: 'Application URL (HTTP)',
    });

    // ===========================================
    // ECR（Elastic Container Registry）リポジトリ作成
    // ===========================================
    // コンテナイメージを保存するためのプライベートリポジトリを作成
    // ECSタスクはここからコンテナイメージをプルして実行する
    const ecrRepository = new EcrRepository(this, 'workshop-repository', {
      // リポジトリ名（小文字・ハイフンのみ使用可能）
      name: `aws-workshop-app-${identifier}`,
      // イメージタグの可変性設定（Mutable: タグの上書き可能）
      imageTagMutability: 'MUTABLE',
      // 暗号化設定（AWS KMSを使用、AWS管理キー）
      encryptionConfiguration: [
        {
          encryptionType: 'KMS',
        },
      ],
      // スタック削除時の動作設定（ワークショップ用のため削除可能にする）
      forceDelete: true,
      tags: {
        Name: 'WorkshopRepository',
      },
    });

    // ===========================================
    // ECS（Elastic Container Service）クラスター作成
    // ===========================================
    // コンテナタスクを実行するための論理的なグループを作成
    // - Fargate起動タイプを使用するため、EC2インスタンスの管理は不要
    // - 作成済みのVPC内にクラスターを配置
    const ecsCluster = new EcsCluster(this, 'workshop-cluster', {
      name: `aws-workshop-cluster-${identifier}`,
      // Container Insights V2を有効化（モニタリング用）
      setting: [
        {
          name: 'containerInsights',
          value: 'enhanced',
        },
      ],
      tags: {
        Name: 'WorkshopCluster',
      },
    });

    // ===========================================
    // ECS Cluster Capacity Provider Associations 作成
    // ===========================================
    // Fargateキャパシティプロバイダーを有効化（CDKの場合は自動で作成される）
    new EcsClusterCapacityProviders(this, 'workshop-cluster-capacity-providers', {
      clusterName: ecsCluster.name,
      capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
      defaultCapacityProviderStrategy: [],
    });

    // ===========================================
    // ECSタスク実行ロール作成
    // ===========================================
    // ECSがタスクを開始し、AWS APIを呼び出すために使用するロール
    const taskExecutionRoleAssumePolicy = new DataAwsIamPolicyDocument(
      this,
      'task-execution-assume-policy',
      {
        statement: [
          {
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['ecs-tasks.amazonaws.com'],
              },
            ],
            actions: ['sts:AssumeRole'],
          },
        ],
      }
    );

    const appTaskExecutionRole = new IamRole(this, 'app-task-execution-role', {
      name: `${identifier}-app-task-execution-role`,
      assumeRolePolicy: taskExecutionRoleAssumePolicy.json,
      tags: {
        Name: 'AppTaskExecutionRole',
      },
    });

    // AWS管理ポリシーをアタッチ（ECSタスク実行に必要）
    new IamRolePolicyAttachment(this, 'task-execution-role-policy', {
      role: appTaskExecutionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // ===========================================
    // ECSタスクロール作成（コンテナ内からAWSサービスにアクセスする場合に使用）
    // ===========================================
    const taskRoleAssumePolicy = new DataAwsIamPolicyDocument(this, 'task-assume-policy', {
      statement: [
        {
          effect: 'Allow',
          principals: [
            {
              type: 'Service',
              identifiers: ['ecs-tasks.amazonaws.com'],
            },
          ],
          actions: ['sts:AssumeRole'],
        },
      ],
    });

    const appTaskRole = new IamRole(this, 'app-task-role', {
      name: `${identifier}-app-task-role`,
      assumeRolePolicy: taskRoleAssumePolicy.json,
      tags: {
        Name: 'AppTaskRole',
      },
    });

    // ===========================================
    // CloudWatch Log Group 作成 (ECS用)
    // ===========================================
    // ECSタスクのログを保存するためのCloudWatch Log Group
    // CDKと同じ設定で作成（保持期間30日、削除時の動作）
    const appContainerLogGroup = new CloudwatchLogGroup(this, 'app-container-log-group', {
      name: `/ecs/aws-workshop-app-${identifier}`,
      retentionInDays: 30,
      skipDestroy: false, // CDKでは削除可能な設定
      tags: {
        Name: 'AppContainerLogGroup',
      },
    });

    // Task Execution Role 追加権限ポリシー（CDKと同じ設定）
    const taskExecutionPolicy = new DataAwsIamPolicyDocument(
      this,
      'task-execution-policy-document',
      {
        statement: [
          {
            // CloudWatch Logs権限
            effect: 'Allow',
            actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: [`${appContainerLogGroup.arn}:*`],
          },
          {
            // ECRリポジトリからのイメージプル権限
            effect: 'Allow',
            actions: [
              'ecr:BatchCheckLayerAvailability',
              'ecr:BatchGetImage',
              'ecr:GetDownloadUrlForLayer',
            ],
            resources: [ecrRepository.arn],
          },
          {
            // ECR認証権限（全リソース対象）
            effect: 'Allow',
            actions: ['ecr:GetAuthorizationToken'],
            resources: ['*'],
          },
        ],
      }
    );

    const taskExecutionAdditionalPolicy = new IamPolicy(this, 'task-execution-additional-policy', {
      name: `${identifier}-task-execution-additional-policy`,
      policy: taskExecutionPolicy.json,
    });

    new IamRolePolicyAttachment(this, 'task-execution-additional-policy-attachment', {
      role: appTaskExecutionRole.name,
      policyArn: taskExecutionAdditionalPolicy.arn,
    });

    // ===========================================
    // ECS Appタスク定義
    // ===========================================
    // サービスを初回作成するために必要な、Appのタスク定義
    // 実際のデプロイメントはCI/CDパイプラインが新しいリビジョンを作成して行う
    const appTaskDefinition = new EcsTaskDefinition(this, 'app-task-def', {
      family: `aws-workshop-app-family-${identifier}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '512', // 0.5 vCPU
      memory: '1024', // 1 GB
      executionRoleArn: appTaskExecutionRole.arn,
      taskRoleArn: appTaskRole.arn,
      runtimePlatform: {
        operatingSystemFamily: 'LINUX',
        cpuArchitecture: 'ARM64',
      },
      // Appのコンテナを追加
      containerDefinitions: JSON.stringify([
        {
          name: 'AppContainer',
          // ポート3000でHTTPサーバーを起動するシンプルなHTTPサーバー
          image: 'nginx:alpine',
          command: [
            'sh',
            '-c',
            'echo \'server { listen 3000; location / { return 200 "<h1>AWS Workshop - Ready for Deployment!</h1><p>Port 3000 HTTP Server is running.</p>"; add_header Content-Type text/html; } }\' > /etc/nginx/conf.d/default.conf && nginx -g "daemon off;"',
          ],
          portMappings: [
            {
              containerPort: 3000, // nginxサーバーは3000番ポートでリッスンする
              protocol: 'tcp',
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': appContainerLogGroup.name,
              'awslogs-region': 'ap-northeast-1',
              'awslogs-stream-prefix': 'ecs-nginx-server',
            },
          },
          essential: true,
        },
      ]),
      tags: {
        Name: 'AppTaskDefinition',
      },
    });

    // ===========================================
    // ECSサービス作成
    // ===========================================
    // コンテナを永続的に実行・管理するためのFargateサービスを作成
    const ecsService = new EcsService(this, 'workshop-fargate-service', {
      name: `workshop-fargate-service-${identifier}`,
      cluster: ecsCluster.id,
      // Appのタスク定義を指定
      taskDefinition: appTaskDefinition.arn,
      // 実行するタスクの希望数
      desiredCount: 2,
      // Fargate起動タイプ
      launchType: 'FARGATE',
      // ネットワーク設定
      networkConfiguration: {
        subnets: [privateSubnet1.id, privateSubnet2.id], // プライベートサブネットに配置
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false, // プライベートサブネットに配置するためパブリックIPは不要
      },
      // ALBのターゲットグループにサービスを関連付ける
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'AppContainer',
          containerPort: 3000,
        },
      ],
      // サービスのヘルスチェック猶予期間
      healthCheckGracePeriodSeconds: 60,
      // ローリングアップデート戦略を指定（CDKと同じ設定）
      deploymentConfiguration: {
        strategy: 'ROLLING',
      },
      // デプロイ時の設定（CDKと同じ値に設定）
      deploymentMaximumPercent: 200, // 最大200%のタスクを起動可能
      deploymentMinimumHealthyPercent: 50, // 最低50%の正常タスクを保持
      tags: {
        Name: 'WorkshopFargateService',
      },
    });

    // ===========================================
    // CloudFormation アウトプット（ECR情報）
    // ===========================================
    new TerraformOutput(this, 'ecr-repository-arn', {
      value: ecrRepository.arn,
      description: 'ECR Repository ARN',
    });

    new TerraformOutput(this, 'ecr-repository-uri', {
      value: ecrRepository.repositoryUrl,
      description: 'ECR Repository URI (for docker push)',
    });

    new TerraformOutput(this, 'ecr-repository-name', {
      value: ecrRepository.name,
      description: 'ECR Repository Name',
    });

    // ===========================================
    // CloudFormation アウトプット（ECSクラスター情報）
    // ===========================================
    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecsCluster.name,
      description: 'ECS Cluster Name',
    });

    new TerraformOutput(this, 'ecs-cluster-arn', {
      value: ecsCluster.arn,
      description: 'ECS Cluster ARN',
    });

    // ===========================================
    // CloudFormation アウトプット（ECSサービス情報）
    // ===========================================
    new TerraformOutput(this, 'ecs-service-name', {
      value: ecsService.name,
      description: 'ECS Service Name',
    });

    // ===========================================
    // CloudFormation Outputs（学生用 Task Definition情報）
    // ===========================================
    new TerraformOutput(this, 'task-execution-role-arn', {
      value: appTaskExecutionRole.arn,
      description: 'Task Execution Role ARN (for student Task Definition)',
    });

    new TerraformOutput(this, 'task-role-arn', {
      value: appTaskRole.arn,
      description: 'Task Role ARN (for student Task Definition)',
    });

    new TerraformOutput(this, 'task-definition-family', {
      value: `aws-workshop-app-family-${identifier}`,
      description: 'Task Definition Family Name (use this for student Task Definition)',
    });

    new TerraformOutput(this, 'student-instructions', {
      value: `Create Task Definition with Family: aws-workshop-app-family-${identifier}, Port: 3000, then Update Service: ${ecsService.name}`,
      description: 'Instructions for student deployment',
    });

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
