module github.com/gnomatix/gnomatix-oss-skills/plugins/agent-darktriad-check

go 1.22

// KontentKop declares its module path as plain `kontentkop`, so it cannot be
// fetched by `go get`. It is resolved from a local clone. The default below is
// a sibling checkout of this repository; scripts/build-go-hook.js overrides it
// with KONTENTKOP_SRC through a temporary go.work file.
replace kontentkop => ../../../KontentKop-Bake-Off

require kontentkop v0.0.0-00010101000000-000000000000

require (
	github.com/kr/pretty v0.3.1 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)
