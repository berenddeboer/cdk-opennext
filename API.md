# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### NextjsSite <a name="NextjsSite" id="cdk-opennext.NextjsSite"></a>

#### Initializers <a name="Initializers" id="cdk-opennext.NextjsSite.Initializer"></a>

```typescript
import { NextjsSite } from 'cdk-opennext'

new NextjsSite(scope: Construct, id: string, props: NextjsSiteProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-opennext.NextjsSite.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-opennext.NextjsSite.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-opennext.NextjsSite.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-opennext.NextjsSiteProps">NextjsSiteProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-opennext.NextjsSite.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-opennext.NextjsSite.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-opennext.NextjsSite.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-opennext.NextjsSiteProps">NextjsSiteProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-opennext.NextjsSite.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="cdk-opennext.NextjsSite.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-opennext.NextjsSite.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="cdk-opennext.NextjsSite.isConstruct"></a>

```typescript
import { NextjsSite } from 'cdk-opennext'

NextjsSite.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="cdk-opennext.NextjsSite.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-opennext.NextjsSite.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#cdk-opennext.NextjsSite.property.customDomainUrl">customDomainUrl</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-opennext.NextjsSite.property.defaultServerFunction">defaultServerFunction</a></code> | <code>aws-cdk-lib.aws_lambda.Function</code> | *No description.* |
| <code><a href="#cdk-opennext.NextjsSite.property.distribution">distribution</a></code> | <code>aws-cdk-lib.aws_cloudfront.Distribution</code> | *No description.* |
| <code><a href="#cdk-opennext.NextjsSite.property.url">url</a></code> | <code>string</code> | *No description.* |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-opennext.NextjsSite.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `customDomainUrl`<sup>Required</sup> <a name="customDomainUrl" id="cdk-opennext.NextjsSite.property.customDomainUrl"></a>

```typescript
public readonly customDomainUrl: string;
```

- *Type:* string

---

##### `defaultServerFunction`<sup>Required</sup> <a name="defaultServerFunction" id="cdk-opennext.NextjsSite.property.defaultServerFunction"></a>

```typescript
public readonly defaultServerFunction: Function;
```

- *Type:* aws-cdk-lib.aws_lambda.Function

---

##### `distribution`<sup>Required</sup> <a name="distribution" id="cdk-opennext.NextjsSite.property.distribution"></a>

```typescript
public readonly distribution: Distribution;
```

- *Type:* aws-cdk-lib.aws_cloudfront.Distribution

---

##### `url`<sup>Required</sup> <a name="url" id="cdk-opennext.NextjsSite.property.url"></a>

```typescript
public readonly url: string;
```

- *Type:* string

---


## Structs <a name="Structs" id="Structs"></a>

### DefaultFunctionProps <a name="DefaultFunctionProps" id="cdk-opennext.DefaultFunctionProps"></a>

Props for Lambda functions, excluding handler and code which are set by the construct.

Extends FunctionOptions and adds runtime.

#### Initializer <a name="Initializer" id="cdk-opennext.DefaultFunctionProps.Initializer"></a>

```typescript
import { DefaultFunctionProps } from 'cdk-opennext'

const defaultFunctionProps: DefaultFunctionProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.maxEventAge">maxEventAge</a></code> | <code>aws-cdk-lib.Duration</code> | The maximum age of a request that Lambda sends to a function for processing. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.onFailure">onFailure</a></code> | <code>aws-cdk-lib.aws_lambda.IDestination</code> | The destination for failed invocations. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.onSuccess">onSuccess</a></code> | <code>aws-cdk-lib.aws_lambda.IDestination</code> | The destination for successful invocations. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.retryAttempts">retryAttempts</a></code> | <code>number</code> | The maximum number of times to retry when the function returns an error. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.adotInstrumentation">adotInstrumentation</a></code> | <code>aws-cdk-lib.aws_lambda.AdotInstrumentationConfig</code> | Specify the configuration of AWS Distro for OpenTelemetry (ADOT) instrumentation. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.allowAllIpv6Outbound">allowAllIpv6Outbound</a></code> | <code>boolean</code> | Whether to allow the Lambda to send all ipv6 network traffic. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.allowAllOutbound">allowAllOutbound</a></code> | <code>boolean</code> | Whether to allow the Lambda to send all network traffic (except ipv6). |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.allowPublicSubnet">allowPublicSubnet</a></code> | <code>boolean</code> | Lambda Functions in a public subnet can NOT access the internet. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.applicationLogLevel">applicationLogLevel</a></code> | <code>string</code> | Sets the application log level for the function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.applicationLogLevelV2">applicationLogLevelV2</a></code> | <code>aws-cdk-lib.aws_lambda.ApplicationLogLevel</code> | Sets the application log level for the function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.architecture">architecture</a></code> | <code>aws-cdk-lib.aws_lambda.Architecture</code> | The system architectures compatible with this lambda function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.codeSigningConfig">codeSigningConfig</a></code> | <code>aws-cdk-lib.interfaces.aws_lambda.ICodeSigningConfigRef</code> | Code signing config associated with this function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.currentVersionOptions">currentVersionOptions</a></code> | <code>aws-cdk-lib.aws_lambda.VersionOptions</code> | Options for the `lambda.Version` resource automatically created by the `fn.currentVersion` method. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.deadLetterQueue">deadLetterQueue</a></code> | <code>aws-cdk-lib.aws_sqs.IQueue</code> | The SQS queue to use if DLQ is enabled. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.deadLetterQueueEnabled">deadLetterQueueEnabled</a></code> | <code>boolean</code> | Enabled DLQ. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.deadLetterTopic">deadLetterTopic</a></code> | <code>aws-cdk-lib.aws_sns.ITopic</code> | The SNS topic to use as a DLQ. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.description">description</a></code> | <code>string</code> | A description of the function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.environment">environment</a></code> | <code>{[ key: string ]: string}</code> | Key-value pairs that Lambda caches and makes available for your Lambda functions. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.environmentEncryption">environmentEncryption</a></code> | <code>aws-cdk-lib.interfaces.aws_kms.IKeyRef</code> | The AWS KMS key that's used to encrypt your function's environment variables. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.ephemeralStorageSize">ephemeralStorageSize</a></code> | <code>aws-cdk-lib.Size</code> | The size of the function’s /tmp directory in MiB. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.events">events</a></code> | <code>aws-cdk-lib.aws_lambda.IEventSource[]</code> | Event sources for this function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.filesystem">filesystem</a></code> | <code>aws-cdk-lib.aws_lambda.FileSystem</code> | The filesystem configuration for the lambda function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.functionName">functionName</a></code> | <code>string</code> | A name for the function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.initialPolicy">initialPolicy</a></code> | <code>aws-cdk-lib.aws_iam.PolicyStatement[]</code> | Initial policy statements to add to the created Lambda Role. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.insightsVersion">insightsVersion</a></code> | <code>aws-cdk-lib.aws_lambda.LambdaInsightsVersion</code> | Specify the version of CloudWatch Lambda insights to use for monitoring. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.ipv6AllowedForDualStack">ipv6AllowedForDualStack</a></code> | <code>boolean</code> | Allows outbound IPv6 traffic on VPC functions that are connected to dual-stack subnets. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.layers">layers</a></code> | <code>aws-cdk-lib.aws_lambda.ILayerVersion[]</code> | A list of layers to add to the function's execution environment. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.logFormat">logFormat</a></code> | <code>string</code> | Sets the logFormat for the function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.loggingFormat">loggingFormat</a></code> | <code>aws-cdk-lib.aws_lambda.LoggingFormat</code> | Sets the loggingFormat for the function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.logGroup">logGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The log group the function sends logs to. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.logRemovalPolicy">logRemovalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | Determine the removal policy of the log group that is auto-created by this construct. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.logRetention">logRetention</a></code> | <code>aws-cdk-lib.aws_logs.RetentionDays</code> | The number of days log events are kept in CloudWatch Logs. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.logRetentionRetryOptions">logRetentionRetryOptions</a></code> | <code>aws-cdk-lib.aws_lambda.LogRetentionRetryOptions</code> | When log retention is specified, a custom resource attempts to create the CloudWatch log group. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.logRetentionRole">logRetentionRole</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The IAM role for the Lambda function associated with the custom resource that sets the retention policy. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.memorySize">memorySize</a></code> | <code>number</code> | The amount of memory, in MB, that is allocated to your Lambda function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.paramsAndSecrets">paramsAndSecrets</a></code> | <code>aws-cdk-lib.aws_lambda.ParamsAndSecretsLayerVersion</code> | Specify the configuration of Parameters and Secrets Extension. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.profiling">profiling</a></code> | <code>boolean</code> | Enable profiling. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.profilingGroup">profilingGroup</a></code> | <code>aws-cdk-lib.aws_codeguruprofiler.IProfilingGroup</code> | Profiling Group. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.recursiveLoop">recursiveLoop</a></code> | <code>aws-cdk-lib.aws_lambda.RecursiveLoop</code> | Sets the Recursive Loop Protection for Lambda Function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.reservedConcurrentExecutions">reservedConcurrentExecutions</a></code> | <code>number</code> | The maximum of concurrent executions you want to reserve for the function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.role">role</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | Lambda execution role. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.runtimeManagementMode">runtimeManagementMode</a></code> | <code>aws-cdk-lib.aws_lambda.RuntimeManagementMode</code> | Sets the runtime management configuration for a function's version. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.securityGroups">securityGroups</a></code> | <code>aws-cdk-lib.aws_ec2.ISecurityGroup[]</code> | The list of security groups to associate with the Lambda's network interfaces. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.snapStart">snapStart</a></code> | <code>aws-cdk-lib.aws_lambda.SnapStartConf</code> | Enable SnapStart for Lambda Function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.systemLogLevel">systemLogLevel</a></code> | <code>string</code> | Sets the system log level for the function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.systemLogLevelV2">systemLogLevelV2</a></code> | <code>aws-cdk-lib.aws_lambda.SystemLogLevel</code> | Sets the system log level for the function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.tenancyConfig">tenancyConfig</a></code> | <code>aws-cdk-lib.aws_lambda.TenancyConfig</code> | The tenancy configuration for the function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | The function execution time (in seconds) after which Lambda terminates the function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.tracing">tracing</a></code> | <code>aws-cdk-lib.aws_lambda.Tracing</code> | Enable AWS X-Ray Tracing for Lambda Function. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.vpc">vpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | VPC network to place Lambda network interfaces. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.vpcSubnets">vpcSubnets</a></code> | <code>aws-cdk-lib.aws_ec2.SubnetSelection</code> | Where to place the network interfaces within the VPC. |
| <code><a href="#cdk-opennext.DefaultFunctionProps.property.runtime">runtime</a></code> | <code>aws-cdk-lib.aws_lambda.Runtime</code> | The runtime environment for the Lambda function. |

---

##### `maxEventAge`<sup>Optional</sup> <a name="maxEventAge" id="cdk-opennext.DefaultFunctionProps.property.maxEventAge"></a>

```typescript
public readonly maxEventAge: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.hours(6)

The maximum age of a request that Lambda sends to a function for processing.

Minimum: 60 seconds
Maximum: 6 hours

---

##### `onFailure`<sup>Optional</sup> <a name="onFailure" id="cdk-opennext.DefaultFunctionProps.property.onFailure"></a>

```typescript
public readonly onFailure: IDestination;
```

- *Type:* aws-cdk-lib.aws_lambda.IDestination
- *Default:* no destination

The destination for failed invocations.

---

##### `onSuccess`<sup>Optional</sup> <a name="onSuccess" id="cdk-opennext.DefaultFunctionProps.property.onSuccess"></a>

```typescript
public readonly onSuccess: IDestination;
```

- *Type:* aws-cdk-lib.aws_lambda.IDestination
- *Default:* no destination

The destination for successful invocations.

---

##### `retryAttempts`<sup>Optional</sup> <a name="retryAttempts" id="cdk-opennext.DefaultFunctionProps.property.retryAttempts"></a>

```typescript
public readonly retryAttempts: number;
```

- *Type:* number
- *Default:* 2

The maximum number of times to retry when the function returns an error.

Minimum: 0
Maximum: 2

---

##### `adotInstrumentation`<sup>Optional</sup> <a name="adotInstrumentation" id="cdk-opennext.DefaultFunctionProps.property.adotInstrumentation"></a>

```typescript
public readonly adotInstrumentation: AdotInstrumentationConfig;
```

- *Type:* aws-cdk-lib.aws_lambda.AdotInstrumentationConfig
- *Default:* No ADOT instrumentation

Specify the configuration of AWS Distro for OpenTelemetry (ADOT) instrumentation.

> [https://aws-otel.github.io/docs/getting-started/lambda](https://aws-otel.github.io/docs/getting-started/lambda)

---

##### `allowAllIpv6Outbound`<sup>Optional</sup> <a name="allowAllIpv6Outbound" id="cdk-opennext.DefaultFunctionProps.property.allowAllIpv6Outbound"></a>

```typescript
public readonly allowAllIpv6Outbound: boolean;
```

- *Type:* boolean
- *Default:* false

Whether to allow the Lambda to send all ipv6 network traffic.

If set to true, there will only be a single egress rule which allows all
outbound ipv6 traffic. If set to false, you must individually add traffic rules to allow the
Lambda to connect to network targets using ipv6.

Do not specify this property if the `securityGroups` or `securityGroup` property is set.
Instead, configure `allowAllIpv6Outbound` directly on the security group.

---

##### `allowAllOutbound`<sup>Optional</sup> <a name="allowAllOutbound" id="cdk-opennext.DefaultFunctionProps.property.allowAllOutbound"></a>

```typescript
public readonly allowAllOutbound: boolean;
```

- *Type:* boolean
- *Default:* true

Whether to allow the Lambda to send all network traffic (except ipv6).

If set to false, you must individually add traffic rules to allow the
Lambda to connect to network targets.

Do not specify this property if the `securityGroups` or `securityGroup` property is set.
Instead, configure `allowAllOutbound` directly on the security group.

---

##### `allowPublicSubnet`<sup>Optional</sup> <a name="allowPublicSubnet" id="cdk-opennext.DefaultFunctionProps.property.allowPublicSubnet"></a>

```typescript
public readonly allowPublicSubnet: boolean;
```

- *Type:* boolean
- *Default:* false

Lambda Functions in a public subnet can NOT access the internet.

Use this property to acknowledge this limitation and still place the function in a public subnet.

> [https://stackoverflow.com/questions/52992085/why-cant-an-aws-lambda-function-inside-a-public-subnet-in-a-vpc-connect-to-the/52994841#52994841](https://stackoverflow.com/questions/52992085/why-cant-an-aws-lambda-function-inside-a-public-subnet-in-a-vpc-connect-to-the/52994841#52994841)

---

##### ~~`applicationLogLevel`~~<sup>Optional</sup> <a name="applicationLogLevel" id="cdk-opennext.DefaultFunctionProps.property.applicationLogLevel"></a>

- *Deprecated:* Use `applicationLogLevelV2` as a property instead.

```typescript
public readonly applicationLogLevel: string;
```

- *Type:* string
- *Default:* "INFO"

Sets the application log level for the function.

---

##### `applicationLogLevelV2`<sup>Optional</sup> <a name="applicationLogLevelV2" id="cdk-opennext.DefaultFunctionProps.property.applicationLogLevelV2"></a>

```typescript
public readonly applicationLogLevelV2: ApplicationLogLevel;
```

- *Type:* aws-cdk-lib.aws_lambda.ApplicationLogLevel
- *Default:* ApplicationLogLevel.INFO

Sets the application log level for the function.

---

##### `architecture`<sup>Optional</sup> <a name="architecture" id="cdk-opennext.DefaultFunctionProps.property.architecture"></a>

```typescript
public readonly architecture: Architecture;
```

- *Type:* aws-cdk-lib.aws_lambda.Architecture
- *Default:* Architecture.X86_64

The system architectures compatible with this lambda function.

---

##### `codeSigningConfig`<sup>Optional</sup> <a name="codeSigningConfig" id="cdk-opennext.DefaultFunctionProps.property.codeSigningConfig"></a>

```typescript
public readonly codeSigningConfig: ICodeSigningConfigRef;
```

- *Type:* aws-cdk-lib.interfaces.aws_lambda.ICodeSigningConfigRef
- *Default:* Not Sign the Code

Code signing config associated with this function.

---

##### `currentVersionOptions`<sup>Optional</sup> <a name="currentVersionOptions" id="cdk-opennext.DefaultFunctionProps.property.currentVersionOptions"></a>

```typescript
public readonly currentVersionOptions: VersionOptions;
```

- *Type:* aws-cdk-lib.aws_lambda.VersionOptions
- *Default:* default options as described in `VersionOptions`

Options for the `lambda.Version` resource automatically created by the `fn.currentVersion` method.

---

##### `deadLetterQueue`<sup>Optional</sup> <a name="deadLetterQueue" id="cdk-opennext.DefaultFunctionProps.property.deadLetterQueue"></a>

```typescript
public readonly deadLetterQueue: IQueue;
```

- *Type:* aws-cdk-lib.aws_sqs.IQueue
- *Default:* SQS queue with 14 day retention period if `deadLetterQueueEnabled` is `true`

The SQS queue to use if DLQ is enabled.

If SNS topic is desired, specify `deadLetterTopic` property instead.

---

##### `deadLetterQueueEnabled`<sup>Optional</sup> <a name="deadLetterQueueEnabled" id="cdk-opennext.DefaultFunctionProps.property.deadLetterQueueEnabled"></a>

```typescript
public readonly deadLetterQueueEnabled: boolean;
```

- *Type:* boolean
- *Default:* false unless `deadLetterQueue` is set, which implies DLQ is enabled.

Enabled DLQ.

If `deadLetterQueue` is undefined,
an SQS queue with default options will be defined for your Function.

---

##### `deadLetterTopic`<sup>Optional</sup> <a name="deadLetterTopic" id="cdk-opennext.DefaultFunctionProps.property.deadLetterTopic"></a>

```typescript
public readonly deadLetterTopic: ITopic;
```

- *Type:* aws-cdk-lib.aws_sns.ITopic
- *Default:* no SNS topic

The SNS topic to use as a DLQ.

Note that if `deadLetterQueueEnabled` is set to `true`, an SQS queue will be created
rather than an SNS topic. Using an SNS topic as a DLQ requires this property to be set explicitly.

---

##### `description`<sup>Optional</sup> <a name="description" id="cdk-opennext.DefaultFunctionProps.property.description"></a>

```typescript
public readonly description: string;
```

- *Type:* string
- *Default:* No description.

A description of the function.

---

##### `environment`<sup>Optional</sup> <a name="environment" id="cdk-opennext.DefaultFunctionProps.property.environment"></a>

```typescript
public readonly environment: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* No environment variables.

Key-value pairs that Lambda caches and makes available for your Lambda functions.

Use environment variables to apply configuration changes, such
as test and production environment configurations, without changing your
Lambda function source code.

---

##### `environmentEncryption`<sup>Optional</sup> <a name="environmentEncryption" id="cdk-opennext.DefaultFunctionProps.property.environmentEncryption"></a>

```typescript
public readonly environmentEncryption: IKeyRef;
```

- *Type:* aws-cdk-lib.interfaces.aws_kms.IKeyRef
- *Default:* AWS Lambda creates and uses an AWS managed customer master key (CMK).

The AWS KMS key that's used to encrypt your function's environment variables.

---

##### `ephemeralStorageSize`<sup>Optional</sup> <a name="ephemeralStorageSize" id="cdk-opennext.DefaultFunctionProps.property.ephemeralStorageSize"></a>

```typescript
public readonly ephemeralStorageSize: Size;
```

- *Type:* aws-cdk-lib.Size
- *Default:* 512 MiB

The size of the function’s /tmp directory in MiB.

---

##### `events`<sup>Optional</sup> <a name="events" id="cdk-opennext.DefaultFunctionProps.property.events"></a>

```typescript
public readonly events: IEventSource[];
```

- *Type:* aws-cdk-lib.aws_lambda.IEventSource[]
- *Default:* No event sources.

Event sources for this function.

You can also add event sources using `addEventSource`.

---

##### `filesystem`<sup>Optional</sup> <a name="filesystem" id="cdk-opennext.DefaultFunctionProps.property.filesystem"></a>

```typescript
public readonly filesystem: FileSystem;
```

- *Type:* aws-cdk-lib.aws_lambda.FileSystem
- *Default:* will not mount any filesystem

The filesystem configuration for the lambda function.

---

##### `functionName`<sup>Optional</sup> <a name="functionName" id="cdk-opennext.DefaultFunctionProps.property.functionName"></a>

```typescript
public readonly functionName: string;
```

- *Type:* string
- *Default:* AWS CloudFormation generates a unique physical ID and uses that ID for the function's name. For more information, see Name Type.

A name for the function.

---

##### `initialPolicy`<sup>Optional</sup> <a name="initialPolicy" id="cdk-opennext.DefaultFunctionProps.property.initialPolicy"></a>

```typescript
public readonly initialPolicy: PolicyStatement[];
```

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement[]
- *Default:* No policy statements are added to the created Lambda role.

Initial policy statements to add to the created Lambda Role.

You can call `addToRolePolicy` to the created lambda to add statements post creation.

---

##### `insightsVersion`<sup>Optional</sup> <a name="insightsVersion" id="cdk-opennext.DefaultFunctionProps.property.insightsVersion"></a>

```typescript
public readonly insightsVersion: LambdaInsightsVersion;
```

- *Type:* aws-cdk-lib.aws_lambda.LambdaInsightsVersion
- *Default:* No Lambda Insights

Specify the version of CloudWatch Lambda insights to use for monitoring.

> [https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights-Getting-Started-docker.html](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights-Getting-Started-docker.html)

---

##### `ipv6AllowedForDualStack`<sup>Optional</sup> <a name="ipv6AllowedForDualStack" id="cdk-opennext.DefaultFunctionProps.property.ipv6AllowedForDualStack"></a>

```typescript
public readonly ipv6AllowedForDualStack: boolean;
```

- *Type:* boolean
- *Default:* false

Allows outbound IPv6 traffic on VPC functions that are connected to dual-stack subnets.

Only used if 'vpc' is supplied.

---

##### `layers`<sup>Optional</sup> <a name="layers" id="cdk-opennext.DefaultFunctionProps.property.layers"></a>

```typescript
public readonly layers: ILayerVersion[];
```

- *Type:* aws-cdk-lib.aws_lambda.ILayerVersion[]
- *Default:* No layers.

A list of layers to add to the function's execution environment.

You can configure your Lambda function to pull in
additional code during initialization in the form of layers. Layers are packages of libraries or other dependencies
that can be used by multiple functions.

---

##### ~~`logFormat`~~<sup>Optional</sup> <a name="logFormat" id="cdk-opennext.DefaultFunctionProps.property.logFormat"></a>

- *Deprecated:* Use `loggingFormat` as a property instead.

```typescript
public readonly logFormat: string;
```

- *Type:* string
- *Default:* "Text"

Sets the logFormat for the function.

---

##### `loggingFormat`<sup>Optional</sup> <a name="loggingFormat" id="cdk-opennext.DefaultFunctionProps.property.loggingFormat"></a>

```typescript
public readonly loggingFormat: LoggingFormat;
```

- *Type:* aws-cdk-lib.aws_lambda.LoggingFormat
- *Default:* LoggingFormat.TEXT

Sets the loggingFormat for the function.

---

##### `logGroup`<sup>Optional</sup> <a name="logGroup" id="cdk-opennext.DefaultFunctionProps.property.logGroup"></a>

```typescript
public readonly logGroup: ILogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.ILogGroup
- *Default:* `/aws/lambda/${this.functionName}` - default log group created by Lambda

The log group the function sends logs to.

By default, Lambda functions send logs to an automatically created default log group named /aws/lambda/\<function name\>.
However you cannot change the properties of this auto-created log group using the AWS CDK, e.g. you cannot set a different log retention.

Use the `logGroup` property to create a fully customizable LogGroup ahead of time, and instruct the Lambda function to send logs to it.

Providing a user-controlled log group was rolled out to commercial regions on 2023-11-16.
If you are deploying to another type of region, please check regional availability first.

---

##### ~~`logRemovalPolicy`~~<sup>Optional</sup> <a name="logRemovalPolicy" id="cdk-opennext.DefaultFunctionProps.property.logRemovalPolicy"></a>

- *Deprecated:* use `logGroup` instead

```typescript
public readonly logRemovalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* RemovalPolicy.Retain

Determine the removal policy of the log group that is auto-created by this construct.

Normally you want to retain the log group so you can diagnose issues
from logs even after a deployment that no longer includes the log group.
In that case, use the normal date-based retention policy to age out your
logs.

---

##### ~~`logRetention`~~<sup>Optional</sup> <a name="logRetention" id="cdk-opennext.DefaultFunctionProps.property.logRetention"></a>

- *Deprecated:* use `logGroup` instead

```typescript
public readonly logRetention: RetentionDays;
```

- *Type:* aws-cdk-lib.aws_logs.RetentionDays
- *Default:* logs.RetentionDays.INFINITE

The number of days log events are kept in CloudWatch Logs.

When updating
this property, unsetting it doesn't remove the log retention policy. To
remove the retention policy, set the value to `INFINITE`.

This is a legacy API and we strongly recommend you move away from it if you can.
Instead create a fully customizable log group with `logs.LogGroup` and use the `logGroup` property
to instruct the Lambda function to send logs to it.
Migrating from `logRetention` to `logGroup` will cause the name of the log group to change.
Users and code and referencing the name verbatim will have to adjust.

In AWS CDK code, you can access the log group name directly from the LogGroup construct:
```ts
import * as logs from 'aws-cdk-lib/aws-logs';

declare const myLogGroup: logs.LogGroup;
myLogGroup.logGroupName;
```

---

##### `logRetentionRetryOptions`<sup>Optional</sup> <a name="logRetentionRetryOptions" id="cdk-opennext.DefaultFunctionProps.property.logRetentionRetryOptions"></a>

```typescript
public readonly logRetentionRetryOptions: LogRetentionRetryOptions;
```

- *Type:* aws-cdk-lib.aws_lambda.LogRetentionRetryOptions
- *Default:* Default AWS SDK retry options.

When log retention is specified, a custom resource attempts to create the CloudWatch log group.

These options control the retry policy when interacting with CloudWatch APIs.

This is a legacy API and we strongly recommend you migrate to `logGroup` if you can.
`logGroup` allows you to create a fully customizable log group and instruct the Lambda function to send logs to it.

---

##### `logRetentionRole`<sup>Optional</sup> <a name="logRetentionRole" id="cdk-opennext.DefaultFunctionProps.property.logRetentionRole"></a>

```typescript
public readonly logRetentionRole: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* A new role is created.

The IAM role for the Lambda function associated with the custom resource that sets the retention policy.

This is a legacy API and we strongly recommend you migrate to `logGroup` if you can.
`logGroup` allows you to create a fully customizable log group and instruct the Lambda function to send logs to it.

---

##### `memorySize`<sup>Optional</sup> <a name="memorySize" id="cdk-opennext.DefaultFunctionProps.property.memorySize"></a>

```typescript
public readonly memorySize: number;
```

- *Type:* number
- *Default:* 128

The amount of memory, in MB, that is allocated to your Lambda function.

Lambda uses this value to proportionally allocate the amount of CPU
power. For more information, see Resource Model in the AWS Lambda
Developer Guide.

---

##### `paramsAndSecrets`<sup>Optional</sup> <a name="paramsAndSecrets" id="cdk-opennext.DefaultFunctionProps.property.paramsAndSecrets"></a>

```typescript
public readonly paramsAndSecrets: ParamsAndSecretsLayerVersion;
```

- *Type:* aws-cdk-lib.aws_lambda.ParamsAndSecretsLayerVersion
- *Default:* No Parameters and Secrets Extension

Specify the configuration of Parameters and Secrets Extension.

> [https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html)

---

##### `profiling`<sup>Optional</sup> <a name="profiling" id="cdk-opennext.DefaultFunctionProps.property.profiling"></a>

```typescript
public readonly profiling: boolean;
```

- *Type:* boolean
- *Default:* No profiling.

Enable profiling.

> [https://docs.aws.amazon.com/codeguru/latest/profiler-ug/setting-up-lambda.html](https://docs.aws.amazon.com/codeguru/latest/profiler-ug/setting-up-lambda.html)

---

##### `profilingGroup`<sup>Optional</sup> <a name="profilingGroup" id="cdk-opennext.DefaultFunctionProps.property.profilingGroup"></a>

```typescript
public readonly profilingGroup: IProfilingGroup;
```

- *Type:* aws-cdk-lib.aws_codeguruprofiler.IProfilingGroup
- *Default:* A new profiling group will be created if `profiling` is set.

Profiling Group.

> [https://docs.aws.amazon.com/codeguru/latest/profiler-ug/setting-up-lambda.html](https://docs.aws.amazon.com/codeguru/latest/profiler-ug/setting-up-lambda.html)

---

##### `recursiveLoop`<sup>Optional</sup> <a name="recursiveLoop" id="cdk-opennext.DefaultFunctionProps.property.recursiveLoop"></a>

```typescript
public readonly recursiveLoop: RecursiveLoop;
```

- *Type:* aws-cdk-lib.aws_lambda.RecursiveLoop
- *Default:* RecursiveLoop.Terminate

Sets the Recursive Loop Protection for Lambda Function.

It lets Lambda detect and terminate unintended recursive loops.

---

##### `reservedConcurrentExecutions`<sup>Optional</sup> <a name="reservedConcurrentExecutions" id="cdk-opennext.DefaultFunctionProps.property.reservedConcurrentExecutions"></a>

```typescript
public readonly reservedConcurrentExecutions: number;
```

- *Type:* number
- *Default:* No specific limit - account limit.

The maximum of concurrent executions you want to reserve for the function.

> [https://docs.aws.amazon.com/lambda/latest/dg/concurrent-executions.html](https://docs.aws.amazon.com/lambda/latest/dg/concurrent-executions.html)

---

##### `role`<sup>Optional</sup> <a name="role" id="cdk-opennext.DefaultFunctionProps.property.role"></a>

```typescript
public readonly role: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* A unique role will be generated for this lambda function. Both supplied and generated roles can always be changed by calling `addToRolePolicy`.

Lambda execution role.

This is the role that will be assumed by the function upon execution.
It controls the permissions that the function will have. The Role must
be assumable by the 'lambda.amazonaws.com' service principal.

The default Role automatically has permissions granted for Lambda execution. If you
provide a Role, you must add the relevant AWS managed policies yourself.

The relevant managed policies are "service-role/AWSLambdaBasicExecutionRole" and
"service-role/AWSLambdaVPCAccessExecutionRole".

---

##### `runtimeManagementMode`<sup>Optional</sup> <a name="runtimeManagementMode" id="cdk-opennext.DefaultFunctionProps.property.runtimeManagementMode"></a>

```typescript
public readonly runtimeManagementMode: RuntimeManagementMode;
```

- *Type:* aws-cdk-lib.aws_lambda.RuntimeManagementMode
- *Default:* Auto

Sets the runtime management configuration for a function's version.

---

##### `securityGroups`<sup>Optional</sup> <a name="securityGroups" id="cdk-opennext.DefaultFunctionProps.property.securityGroups"></a>

```typescript
public readonly securityGroups: ISecurityGroup[];
```

- *Type:* aws-cdk-lib.aws_ec2.ISecurityGroup[]
- *Default:* If the function is placed within a VPC and a security group is not specified, either by this or securityGroup prop, a dedicated security group will be created for this function.

The list of security groups to associate with the Lambda's network interfaces.

Only used if 'vpc' is supplied.

---

##### `snapStart`<sup>Optional</sup> <a name="snapStart" id="cdk-opennext.DefaultFunctionProps.property.snapStart"></a>

```typescript
public readonly snapStart: SnapStartConf;
```

- *Type:* aws-cdk-lib.aws_lambda.SnapStartConf
- *Default:* No snapstart

Enable SnapStart for Lambda Function.

SnapStart is currently supported for Java 11, Java 17, Python 3.12, Python 3.13, and .NET 8 runtime

---

##### ~~`systemLogLevel`~~<sup>Optional</sup> <a name="systemLogLevel" id="cdk-opennext.DefaultFunctionProps.property.systemLogLevel"></a>

- *Deprecated:* Use `systemLogLevelV2` as a property instead.

```typescript
public readonly systemLogLevel: string;
```

- *Type:* string
- *Default:* "INFO"

Sets the system log level for the function.

---

##### `systemLogLevelV2`<sup>Optional</sup> <a name="systemLogLevelV2" id="cdk-opennext.DefaultFunctionProps.property.systemLogLevelV2"></a>

```typescript
public readonly systemLogLevelV2: SystemLogLevel;
```

- *Type:* aws-cdk-lib.aws_lambda.SystemLogLevel
- *Default:* SystemLogLevel.INFO

Sets the system log level for the function.

---

##### `tenancyConfig`<sup>Optional</sup> <a name="tenancyConfig" id="cdk-opennext.DefaultFunctionProps.property.tenancyConfig"></a>

```typescript
public readonly tenancyConfig: TenancyConfig;
```

- *Type:* aws-cdk-lib.aws_lambda.TenancyConfig
- *Default:* Tenant isolation is not enabled

The tenancy configuration for the function.

---

##### `timeout`<sup>Optional</sup> <a name="timeout" id="cdk-opennext.DefaultFunctionProps.property.timeout"></a>

```typescript
public readonly timeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.seconds(3)

The function execution time (in seconds) after which Lambda terminates the function.

Because the execution time affects cost, set this value
based on the function's expected execution time.

---

##### `tracing`<sup>Optional</sup> <a name="tracing" id="cdk-opennext.DefaultFunctionProps.property.tracing"></a>

```typescript
public readonly tracing: Tracing;
```

- *Type:* aws-cdk-lib.aws_lambda.Tracing
- *Default:* Tracing.Disabled

Enable AWS X-Ray Tracing for Lambda Function.

---

##### `vpc`<sup>Optional</sup> <a name="vpc" id="cdk-opennext.DefaultFunctionProps.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* aws-cdk-lib.aws_ec2.IVpc
- *Default:* Function is not placed within a VPC.

VPC network to place Lambda network interfaces.

Specify this if the Lambda function needs to access resources in a VPC.
This is required when `vpcSubnets` is specified.

---

##### `vpcSubnets`<sup>Optional</sup> <a name="vpcSubnets" id="cdk-opennext.DefaultFunctionProps.property.vpcSubnets"></a>

```typescript
public readonly vpcSubnets: SubnetSelection;
```

- *Type:* aws-cdk-lib.aws_ec2.SubnetSelection
- *Default:* the Vpc default strategy if not specified

Where to place the network interfaces within the VPC.

This requires `vpc` to be specified in order for interfaces to actually be
placed in the subnets. If `vpc` is not specify, this will raise an error.

Note: Internet access for Lambda Functions requires a NAT Gateway, so picking
public subnets is not allowed (unless `allowPublicSubnet` is set to `true`).

---

##### `runtime`<sup>Optional</sup> <a name="runtime" id="cdk-opennext.DefaultFunctionProps.property.runtime"></a>

```typescript
public readonly runtime: Runtime;
```

- *Type:* aws-cdk-lib.aws_lambda.Runtime
- *Default:* Runtime.NODEJS_24_X

The runtime environment for the Lambda function.

---

### DistributionDomainProps <a name="DistributionDomainProps" id="cdk-opennext.DistributionDomainProps"></a>

#### Initializer <a name="Initializer" id="cdk-opennext.DistributionDomainProps.Initializer"></a>

```typescript
import { DistributionDomainProps } from 'cdk-opennext'

const distributionDomainProps: DistributionDomainProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-opennext.DistributionDomainProps.property.domainName">domainName</a></code> | <code>string</code> | The domain to be assigned to the website URL (ie. domain.com). |
| <code><a href="#cdk-opennext.DistributionDomainProps.property.certificate">certificate</a></code> | <code>aws-cdk-lib.aws_certificatemanager.ICertificate</code> | The ACM certificate to use for the custom domain. |
| <code><a href="#cdk-opennext.DistributionDomainProps.property.hostedZone">hostedZone</a></code> | <code>aws-cdk-lib.aws_route53.IHostedZone</code> | Import the underlying Route 53 hosted zone. |

---

##### `domainName`<sup>Required</sup> <a name="domainName" id="cdk-opennext.DistributionDomainProps.property.domainName"></a>

```typescript
public readonly domainName: string;
```

- *Type:* string

The domain to be assigned to the website URL (ie. domain.com).

Supports domains that are hosted either on [Route 53](https://aws.amazon.com/route53/) or externally.

---

##### `certificate`<sup>Optional</sup> <a name="certificate" id="cdk-opennext.DistributionDomainProps.property.certificate"></a>

```typescript
public readonly certificate: ICertificate;
```

- *Type:* aws-cdk-lib.aws_certificatemanager.ICertificate

The ACM certificate to use for the custom domain.

Required if `hostedZone` is not provided. The certificate must be in
us-east-1 for CloudFront distributions.

When provided without `hostedZone`, no DNS aliases will be created
and you must configure DNS records externally.

---

##### `hostedZone`<sup>Optional</sup> <a name="hostedZone" id="cdk-opennext.DistributionDomainProps.property.hostedZone"></a>

```typescript
public readonly hostedZone: IHostedZone;
```

- *Type:* aws-cdk-lib.aws_route53.IHostedZone

Import the underlying Route 53 hosted zone.

Required if `certificate` is not provided. When provided, a DNS-validated
certificate will be created automatically and DNS aliases will be set up.

---

### NextjsSiteProps <a name="NextjsSiteProps" id="cdk-opennext.NextjsSiteProps"></a>

#### Initializer <a name="Initializer" id="cdk-opennext.NextjsSiteProps.Initializer"></a>

```typescript
import { NextjsSiteProps } from 'cdk-opennext'

const nextjsSiteProps: NextjsSiteProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-opennext.NextjsSiteProps.property.customDomain">customDomain</a></code> | <code><a href="#cdk-opennext.DistributionDomainProps">DistributionDomainProps</a></code> | The customDomain for this website. |
| <code><a href="#cdk-opennext.NextjsSiteProps.property.defaultFunctionProps">defaultFunctionProps</a></code> | <code><a href="#cdk-opennext.DefaultFunctionProps">DefaultFunctionProps</a></code> | Default props to apply to all Lambda functions created by this construct. |
| <code><a href="#cdk-opennext.NextjsSiteProps.property.openNextPath">openNextPath</a></code> | <code>string</code> | Should point to the .open-next directory. |

---

##### `customDomain`<sup>Optional</sup> <a name="customDomain" id="cdk-opennext.NextjsSiteProps.property.customDomain"></a>

```typescript
public readonly customDomain: DistributionDomainProps;
```

- *Type:* <a href="#cdk-opennext.DistributionDomainProps">DistributionDomainProps</a>

The customDomain for this website.

This domain must be hosted in
route53, and we must be able to create an ACM certificate for this
domain.

Note that you can also migrate externally hosted domains to Route 53 by
[following this guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/MigratingDNS.html).

---

##### `defaultFunctionProps`<sup>Optional</sup> <a name="defaultFunctionProps" id="cdk-opennext.NextjsSiteProps.property.defaultFunctionProps"></a>

```typescript
public readonly defaultFunctionProps: DefaultFunctionProps;
```

- *Type:* <a href="#cdk-opennext.DefaultFunctionProps">DefaultFunctionProps</a>

Default props to apply to all Lambda functions created by this construct.

These can be overridden by specific function configurations.

---

##### `openNextPath`<sup>Optional</sup> <a name="openNextPath" id="cdk-opennext.NextjsSiteProps.property.openNextPath"></a>

```typescript
public readonly openNextPath: string;
```

- *Type:* string
- *Default:* ".open-next"

Should point to the .open-next directory.

---



