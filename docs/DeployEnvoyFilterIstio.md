The following instructions are for deploying an EnvoyFilter resource into istio. This is generally useful as Istio's custom WasmPlugin resources is missing a number of features/configuration options for Wasm plugins.
Notably:
- The default WasmPlugin resource doesn't support TCP filters
- The default WasmPlugin resource doesn't allow for configuring vm_id

We use an EnvoyFilter resource to deploy the WASM plugin in the account-CRUD demo.

Furthermore, this tutorial focuses on deploying using a local wasm file and a ConfigMap. While not recommended due to the fact this approach requires modifying the manifest of the pod you are deploying into, we provide it here as reference.
---

Learnings based off:
https://sirishagopigiri-692.medium.com/deploying-envoy-filter-on-istio-ce2d2573b981

See Tutorial Above for Full explanation. Below are some useful/notable steps and commands

## Pre-Reqs
- Istio Installed
- Namespaces Labelled: `kubectl label namespace default istio-injection=enabled`
- Create & Write Wasm Plugin (See WASMPluginFromScratch.md)

## Deploying
### Create Config Map in Default Namespace: only done once
`kubectl create configmap NAME-filter --from-file=NAME-filter.wasm=main.wasm`
	
#### Modify Application yml Deployment: only done once unless file is edited
* In the Deployment section of the App, under `spec.template.metadata` add these annotations:
- `sidecar.istio.io/userVolume: '[{"name":"NAME-filter","configMap":{"name":"NAME-filter"}}]'`
- `sidecar.istio.io/userVolumeMount: '[{"mountPath":"/var/local/wasm","name":"NAME-filter"}]'`
- `sidecar.istio.io/logLevel: "info"`
					
#### Redeploy Service
`kubectl apply -f <filename>.yml`
					
##### Can view annotations w/
`kubectl describe pod POD-NAME|grep -i NAME-filter`
	
**Testing:**
You can test Service Response now w/ wtv curl command you have. Just to ensure you have connectivity before we deploy the Plugin.

**Get Logs for Plugin**
`kubectl logs -f -l app=NAME-c istio-proxy`

**Deploy EnvoyFilter**    
`kubectl apply -f filter.yml`

**Verify deployment**
`kubectl get envoyfilter`

---
Here I have provided a manifest file for an HTTP as well as a TCP EnvoyFilter. Both of these were tested and worked when deploying using the strategy outlined in the article.

# HTTP Filter
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: golang-filter-<NAME>
spec:
  workloadSelector:
    labels:
      app: <NAME>
  configPatches:
    # The first patch adds the lua filter to the listener/http connection manager
  - applyTo: HTTP_FILTER
    match:
      context: SIDECAR_INBOUND
      listener:
        filterChain:
          filter:
            name: envoy.filters.network.http_connection_manager
            subFilter:
              name: envoy.filters.http.router
    patch:
      operation: INSERT_BEFORE
      value: # lua filter specification
        name: envoy.filters.http.wasm
        typed_config:
          '@type': type.googleapis.com/udpa.type.v1.TypedStruct
          type_url: type.googleapis.com/envoy.extensions.filters.http.wasm.v3.Wasm
          value:
            config:
              vm_config:
                code:
                  local:
                    filename: /var/local/wasm/<FILE-NAME-IN-CONFIG-MAP>.wasm
                runtime: envoy.wasm.runtime.v8
```

# TCP Filter
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: golang-filter-<NAME>
spec:
  workloadSelector:
    labels:
      app: <NAME>
  configPatches:
    # The first patch adds the lua filter to the listener/http connection manager
  - applyTo: NETWORK_FILTER
    match:
      context: ANY
      listener:
        filterChain:
          filter:
            name: "envoy.filters.network.tcp_proxy"
    patch:
      operation: INSERT_BEFORE
      value: # lua filter specification
        name: envoy.filters.network.wasm
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.wasm.v3.Wasm
          config:
            name: "lineage-filter-plugin"
            vm_config:
              code:
                local:
                  filename: /var/local/wasm/<FILE-NAME-IN-CONFIG-MAP>.wasm
              allow_precompiled: true
```