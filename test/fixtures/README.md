# Published 0.7.0 migration baseline

`0.7.0-identities.json` records stateful resource logical IDs, custom-resource
service tokens, and provider function IDs synthesized from **the published npm
package**, not the current source. Capture with CDK **2.274.0**, matching the
release's peer minimum. The main test adds a warmer and an additional origin to
the standard fixture and compares both generated-role and supplied-role templates.

To regenerate from the repository root after `npm ci`:

```sh
mkdir -p /tmp/opencode/cdk-opennext-baseline
npm pack cdk-opennext@0.7.0 --pack-destination /tmp/opencode/cdk-opennext-baseline
tar -xzf /tmp/opencode/cdk-opennext-baseline/cdk-opennext-0.7.0.tgz -C /tmp/opencode/cdk-opennext-baseline
NODE_PATH="$PWD/node_modules" node test/fixtures/capture-0.7.0.cjs /tmp/opencode/cdk-opennext-baseline/package > /tmp/opencode/cdk-opennext-baseline/identities.json
```

Compare the resulting JSON structurally with the committed fixture before
replacing it (formatting may differ). If your npm configuration limits package
publication dates, explicitly allow the release date when packing 0.7.0.
The captured npm archive has SHA-1 `339cd41ad11fe6c42923cdef76aa8c466347689a`.
Do not refresh this historical baseline against newer CDK versions to make
compatibility failures pass; investigate changed identities instead.
