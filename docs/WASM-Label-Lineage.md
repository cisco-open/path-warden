# Relevant Files:
* Everything in account-CRUD: This is your Test app/service chain
* Istio-1.6.1/wasm-lineage-headers: This is your actual plugin

---

The following deployment strategy and relevant EnvoyFilter were created referencing this:
https://github.com/halfrost/sentinel-go-envoy-proxy-wasm

---
		
# Before:
We were deploying w/ wasm.yml & using the Istio WasmPlugin resource. However. b/c we need to be able to set the vm_id, we have to deploy w/ EnvoyFilter.
- The Files named "envoyFilter" and "envoyFilter2" both deploy using a "local" .wasm binary file. These can found in the archive folder. The file is local to the flaskapp & uploaded w/ a configmap: `kubectl create configmap lin-hdrs-filter --from-file=lin-hdrs-filter.wasm=main.wasm`
- We DON’T use the Local Deployment Option anymore.
- Instead, we deploy w/ EnvoyFilterRemote. This retrieves the filter from a remote repo (GC storage). We do this so that the manifest of the service we would like to apply the filter to does not need to be edited.
		
# Now:
These are the steps to follow after editing the main.go file:
*after editing your main.go*
1. Build the go file into a wasm binary
`tinygo build -o main.wasm -scheduler=none -target=wasi main.go`
2. Update the yaml to contain the right sha256 hash
`./update_yaml.sh`
3. Upload file to Gcloud Bucket & Set proper permissions & Caching Restriction
`BUCKET_NAME="<your-bucket>"`
`gsutil cp main.wasm gs://$BUCKET_NAME`
`gsutil acl ch -u AllUsers:R gs://$BUCKET_NAME/main.wasm`
`gsutil setmeta -h "Cache-Control:no-cache" gs://$BUCKET_NAME/main.wasm`
4. Redploy Envoy Filter
`kubectl delete -f envoyFilterRemote.yaml`
`kubectl apply -f envoyFilterRemote.yaml`
	
* View the Filter's Logs
`kubectl logs $(kubectl get pod -l app=flaskapi -o name) -c istio-proxy`
* Curl the service the filter is applied to (and you can view the logs again)
`curl $(kubectl get svc identify-svc-lb -o jsonpath='{.status.loadBalancer.ingress[0].ip}')/users`
	
# Futher NOTES:
- We Commented out/removed the Config File annotations in the flaskapi & mysql manifests b/c we aren't using the local deployment anymore
		
- If you're having a caching problem w/ Istio, append "?wtv=123" to the end of the uri in the deployment file and it will get the new one for sure. It should get un-cached in 1 hour

- Gets hash of file: `sha256sum main.wasm`
			
- There are various GoogleCloud URL formats for bucket objects. This is the only format of URL that works w/ EnvoyFilter: `http://wasm-lineage-headers.storage.googleapis.com/main.wasm?id=1`
	
- You HAVE TO do the no-cache metadata thing otherwise Istio will cache it and you can edit & update the filter (You can always do the url thing w/ ?wtv=123)
		
---

Other Things we learned:
* vm_id has to be the same for various plugins that want to access the same data
	
* This list of Packages supported by TinyGo is not Exhaustive:
- https://tinygo.org/docs/reference/lang-support/stdlib/#fmt
	
# Links
A set of usefule resources

* Alternative EnvoyFilter Manifest Example (did not use): https://github.com/istio-ecosystem/wasm-extensions/blob/master/example/config/example-filter.yaml
	
* Best Explanation for Threads and Wasm Modules: https://thenewstack.io/wasm-modules-and-envoy-extensibility-explained-part-1/
		
* Go Wasm SDK Documentation: https://github.com/tetratelabs/proxy-wasm-go-sdk/blob/main/doc/OVERVIEW.md

* Gjson - Easiest way to get JSON working in TinyGo: https://github.com/tidwall/gjson
