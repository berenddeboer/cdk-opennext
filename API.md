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

##### `hostedZone`<sup>Required</sup> <a name="hostedZone" id="cdk-opennext.DistributionDomainProps.property.hostedZone"></a>

```typescript
public readonly hostedZone: IHostedZone;
```

- *Type:* aws-cdk-lib.aws_route53.IHostedZone

Import the underlying Route 53 hosted zone.

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
| <code><a href="#cdk-opennext.NextjsSiteProps.property.openNextPath">openNextPath</a></code> | <code>string</code> | Should point to the .open-next directory. |
| <code><a href="#cdk-opennext.NextjsSiteProps.property.customDomain">customDomain</a></code> | <code><a href="#cdk-opennext.DistributionDomainProps">DistributionDomainProps</a></code> | The customDomain for this website. |
| <code><a href="#cdk-opennext.NextjsSiteProps.property.environment">environment</a></code> | <code>{[ key: string ]: string}</code> | An object with the key being the environment variable name. |

---

##### `openNextPath`<sup>Required</sup> <a name="openNextPath" id="cdk-opennext.NextjsSiteProps.property.openNextPath"></a>

```typescript
public readonly openNextPath: string;
```

- *Type:* string
- *Default:* ".open-next"

Should point to the .open-next directory.

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

##### `environment`<sup>Optional</sup> <a name="environment" id="cdk-opennext.NextjsSiteProps.property.environment"></a>

```typescript
public readonly environment: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}

An object with the key being the environment variable name.

---



