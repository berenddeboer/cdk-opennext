# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### OpenNextCdk <a name="OpenNextCdk" id="cdk-opennext.OpenNextCdk"></a>

#### Initializers <a name="Initializers" id="cdk-opennext.OpenNextCdk.Initializer"></a>

```typescript
import { OpenNextCdk } from 'cdk-opennext'

new OpenNextCdk(scope: Construct, id: string, props: OpenNextCdkProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-opennext.OpenNextCdk.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-opennext.OpenNextCdk.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-opennext.OpenNextCdk.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-opennext.OpenNextCdkProps">OpenNextCdkProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-opennext.OpenNextCdk.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-opennext.OpenNextCdk.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-opennext.OpenNextCdk.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-opennext.OpenNextCdkProps">OpenNextCdkProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-opennext.OpenNextCdk.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="cdk-opennext.OpenNextCdk.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-opennext.OpenNextCdk.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="cdk-opennext.OpenNextCdk.isConstruct"></a>

```typescript
import { OpenNextCdk } from 'cdk-opennext'

OpenNextCdk.isConstruct(x: any)
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

###### `x`<sup>Required</sup> <a name="x" id="cdk-opennext.OpenNextCdk.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-opennext.OpenNextCdk.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#cdk-opennext.OpenNextCdk.property.defaultServerFunction">defaultServerFunction</a></code> | <code>aws-cdk-lib.aws_lambda.Function</code> | *No description.* |
| <code><a href="#cdk-opennext.OpenNextCdk.property.distribution">distribution</a></code> | <code>aws-cdk-lib.aws_cloudfront.Distribution</code> | *No description.* |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-opennext.OpenNextCdk.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `defaultServerFunction`<sup>Required</sup> <a name="defaultServerFunction" id="cdk-opennext.OpenNextCdk.property.defaultServerFunction"></a>

```typescript
public readonly defaultServerFunction: Function;
```

- *Type:* aws-cdk-lib.aws_lambda.Function

---

##### `distribution`<sup>Required</sup> <a name="distribution" id="cdk-opennext.OpenNextCdk.property.distribution"></a>

```typescript
public readonly distribution: Distribution;
```

- *Type:* aws-cdk-lib.aws_cloudfront.Distribution

---


## Structs <a name="Structs" id="Structs"></a>

### OpenNextCdkProps <a name="OpenNextCdkProps" id="cdk-opennext.OpenNextCdkProps"></a>

#### Initializer <a name="Initializer" id="cdk-opennext.OpenNextCdkProps.Initializer"></a>

```typescript
import { OpenNextCdkProps } from 'cdk-opennext'

const openNextCdkProps: OpenNextCdkProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-opennext.OpenNextCdkProps.property.openNextPath">openNextPath</a></code> | <code>string</code> | Should point to the .open-next directory. |

---

##### `openNextPath`<sup>Required</sup> <a name="openNextPath" id="cdk-opennext.OpenNextCdkProps.property.openNextPath"></a>

```typescript
public readonly openNextPath: string;
```

- *Type:* string

Should point to the .open-next directory.

---



