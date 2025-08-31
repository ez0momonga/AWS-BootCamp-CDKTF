# CDK to CDKTF Resource Mapping Reference

## Import文の対応

### CDK
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elbv2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
```

### CDKTF
```typescript
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from './.gen/providers/aws/provider';
import { Vpc } from './.gen/providers/aws/vpc';
import { Subnet } from './.gen/providers/aws/subnet';
import { InternetGateway } from './.gen/providers/aws/internet-gateway';
import { NatGateway } from './.gen/providers/aws/nat-gateway';
import { SecurityGroup } from './.gen/providers/aws/security-group';
import { SecurityGroupRule } from './.gen/providers/aws/security-group-rule';
import { Lb } from './.gen/providers/aws/lb';
import { LbTargetGroup } from './.gen/providers/aws/lb-target-group';
import { LbListener } from './.gen/providers/aws/lb-listener';
import { EcsCluster } from './.gen/providers/aws/ecs-cluster';
import { EcrRepository } from './.gen/providers/aws/ecr-repository';
import { IamRole } from './.gen/providers/aws/iam-role';
import { EcsTaskDefinition } from './.gen/providers/aws/ecs-task-definition';
import { EcsService } from './.gen/providers/aws/ecs-service';
```

## ネットワークリソース対応表

### VPC
| CDK | CDKTF | 主な違い |
|-----|-------|----------|
| `new ec2.Vpc()` | `new Vpc()` | CDKは自動でサブネット作成、CDKTFは手動 |

**CDK実装例:**
```typescript
this.vpc = new ec2.Vpc(this, 'WorkshopVpc', {
  maxAzs: 2,
  ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
  subnetConfiguration: [
    {
      cidrMask: 24,
      name: 'PublicSubnet',
      subnetType: ec2.SubnetType.PUBLIC,
    },
    {
      cidrMask: 24,
      name: 'PrivateSubnet',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    },
  ],
});
```

**CDKTF実装例:**
```typescript
const vpc = new Vpc(this, 'workshop-vpc', {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Name: 'WorkshopVpc'
  }
});

// サブネットは個別に作成が必要
const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
  vpcId: vpc.id,
  cidrBlock: '10.0.1.0/24',
  availabilityZone: 'ap-northeast-1a',
  mapPublicIpOnLaunch: true,
  tags: {
    Name: 'PublicSubnet1'
  }
});
```

### セキュリティグループ
| CDK | CDKTF | 主な違い |
|-----|-------|----------|
| `SecurityGroup.addIngressRule()` | `SecurityGroupRule` | CDKTFはルールごとに個別リソース |

**CDK実装例:**
```typescript
this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
  vpc: this.vpc,
  description: 'Security group for Application Load Balancer',
});

this.albSecurityGroup.addIngressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(80),
  'Allow HTTP traffic',
);
```

**CDKTF実装例:**
```typescript
const albSecurityGroup = new SecurityGroup(this, 'alb-security-group', {
  vpcId: vpc.id,
  description: 'Security group for Application Load Balancer',
  tags: {
    Name: 'AlbSecurityGroup'
  }
});

new SecurityGroupRule(this, 'alb-http-ingress', {
  type: 'ingress',
  fromPort: 80,
  toPort: 80,
  protocol: 'tcp',
  cidrBlocks: ['0.0.0.0/0'],
  securityGroupId: albSecurityGroup.id,
  description: 'Allow HTTP traffic'
});
```

## ELB/ALBリソース対応表

### Application Load Balancer
| CDK | CDKTF | 主な違い |
|-----|-------|----------|
| `ApplicationLoadBalancer` | `Lb` (type: "application") | CDKTF は type パラメータで指定 |

**CDK実装例:**
```typescript
this.alb = new elbv2.ApplicationLoadBalancer(this, 'WorkshopAlb', {
  vpc: this.vpc,
  internetFacing: true,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PUBLIC,
  },
  securityGroup: this.albSecurityGroup,
});
```

**CDKTF実装例:**
```typescript
const alb = new Lb(this, 'workshop-alb', {
  name: 'workshop-alb',
  loadBalancerType: 'application',
  scheme: 'internet-facing',
  subnets: [publicSubnet1.id, publicSubnet2.id],
  securityGroups: [albSecurityGroup.id],
});
```

## ECSリソース対応表

### ECS Cluster
| CDK | CDKTF | 主な違い |
|-----|-------|----------|
| `ecs.Cluster` | `EcsCluster` | 設定項目がほぼ同等 |

**CDK実装例:**
```typescript
this.ecsCluster = new ecs.Cluster(this, 'WorkshopCluster', {
  vpc: this.vpc,
  clusterName: `aws-workshop-cluster-${identifier}`,
  enableFargateCapacityProviders: true,
  containerInsightsV2: ecs.ContainerInsights.ENHANCED,
});
```

**CDKTF実装例:**
```typescript
const ecsCluster = new EcsCluster(this, 'workshop-cluster', {
  name: 'aws-workshop-cluster-default',
  capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
  setting: [{
    name: 'containerInsightsV2',
    value: 'enabled'
  }]
});
```

## CloudFormation出力の対応

### CDK
```typescript
new cdk.CfnOutput(this, 'VpcId', {
  value: this.vpc.vpcId,
  description: 'VPC ID',
});
```

### CDKTF
```typescript
new TerraformOutput(this, 'vpc-id', {
  value: vpc.id,
  description: 'VPC ID',
});
```

## 注意事項

1. **リソース参照**: CDKは自動的にリソース間の参照を解決するが、CDKTFでは `${resource.id}` 形式で明示的に参照する
2. **依存関係**: CDKTFでは `dependsOn` プロパティで明示的に依存関係を指定する場合がある
3. **プロバイダー生成**: `cdktf get` でプロバイダーバインディングを生成する必要がある
4. **命名規則**: CDKTFはTerraformの命名規則に従う（ハイフン区切り推奨）