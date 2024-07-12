# Label Set Security Plugin for Istio

This directory contains all files relevant to the development of the tinygo plugin written for the Istio sidecar which parses, validates & caches LabelSets.

## 'main.go'

This is the plugin written using tinygo and the go proxywasm library.

## 'main_no_opa.go'

A slightly modified version of the plugin that removes and instead mocks the OPA call but retains the Caching mechanism of the plugin. This was used to test the overhead of OPA.

## 'envoyFilterRemote.yaml'

One part of the process of deploying the plugin. Notably, it pulls in the plugin in remotely from GoogleCloud as opposed to loading the plugin from a local file in a ConfigMap. See other documentation for local ConfigMap details.

We deploy this way so that the application we are applying this filter to does not need its manifest modified.

## 'update_yaml.sh'

A helper script used in deployment that helpfully changes the hash in the 'envoyFilterRemote.yaml' file so that Istio actually changes out the cached plugin instantly instead of needing to wait an hour

## 'wasm.yml' (deprecated)

A manifest file for Istio's WasmPlugin resource. However, their implementation lack some configuration options when compared to the less abstract EnvoyFilter (see note below), so an EnvoyFilter manifest was used instead.

Note: Specifically, we desired the ability to set a vm_id so that multiple plugins can share access to the same cache.

## 'utl-wasm-lin-headers.txt'

Contains a number of variuos helpful commands for dealing with this directory. Of note, there is the list of "#UPDATED - FINAL Editing FLOW" commands which (after proper configuration of GoogleCloud) can just be pasted and will properly deploy the updated plugin. (Though make sure to watch the console as errors for the plugin can be difficult to see through all the text. Of course, errors mean the new plugin won't deploy.)
