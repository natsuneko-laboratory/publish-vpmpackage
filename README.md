# @natsuneko-laboratory/publish-vpmpackage

GitHub Actions for publishing a VPMPackage to [Remuria](https://remuria.natsuneko.com), via OIDC authentication.

## Example

```yaml
name: "Release by Tag"

on:
  push:
    tags:
      - "v**"
  workflow_dispatch:

permissions:
  contents: read
  id-token: write

jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.vars.outputs.version }}
    steps:
      - id: vars
        run: |
          VERSION=$(echo ${{ github.ref }} | sed -e 's/refs\/tags\///' | sed -e 's/refs\/heads\///')
          echo "version=${VERSION}" >> $GITHUB_OUTPUT

  build-vpmpackage:
    runs-on: ubuntu-latest
    needs: [setup]
    steps:
      - uses: actions/checkout@08eba0b27e820071cde6df949e0beb9ba4906955 # v4.3.0
        with:
          lfs: true

      - run: |
          mkdir -p dist

      - uses: natsuneko-laboratory/create-vpmpackage@afd6b5e106f88d14b915c0c538c0315d83bba447 # v1.5.0
        with:
          packages: |
            Assets/NatsunekoLaboratory/CollapsibleBlendShapes/package.json
          outputs: |
            dist/CollapsibleBlendShapes-${{ needs.setup.outputs.version }}.zip

      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          path: dist/*.zip
          name: VPMPackages

      - uses: natsuneko-laboratory/publish-vpmpackage@a9b2894491e22bf0e21e959a7ca70f974476047e # v0.2.7
        with:
          packages: |
            dist/CollapsibleBlendShapes-${{ needs.setup.outputs.version }}.zip
```

## License

MIT by [@6jz](https://twitter.com/6jz)
