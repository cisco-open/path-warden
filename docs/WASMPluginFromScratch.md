This is only a general overview for writing WASM plugins from scratch.
- NOTE: All dependencies must already be installed (Go, TinyGo, Minikube, Istio, docker)

`mkdir <wasm-extension-name> && cd <wasm-extension-name>`

**Initialize the Go Module**
`go mod init <wasm-extension-name>`

*write main.go file*

**Download the dependencies**
`go mod tidy`

**Write the yaml manifest file**
- We can use either a WasmPlugin resource or an EnvoyFilter. WasmPlugin is easier and more abstract but lacks a number of features which is why the demo account-CRUD uses EnvoyFilter

**Compile the Wasm Plugin**
`rm main.wasm`
- seemingly necessary since the following the command doesn't override existing file
`tinygo build -o main.wasm -scheduler=none -target=wasi main.go`

**Deploy Manifest**
The steps prior to this vary depending on whether you are deploying using a remote file on GoogleCloud or a local file and a ConfigMap. Below is provided the instructions for a remote file:

*Follow "Editing Flow" instructions found in utils file*
(provided here for reference)

`rm main.wasm`
`tinygo build -o main.wasm -scheduler=none -target=wasi main.go`
`./update_yaml.sh`
`BUCKET_NAME="<bucket-name>"`
`gsutil cp main.wasm gs://$BUCKET_NAME`
`gsutil acl ch -u AllUsers:R gs://$BUCKET_NAME/main.wasm`
`gsutil setmeta -h "Cache-Control:no-cache" gs://$BUCKET_NAME/main.wasm`
`kubectl delete -f <wasm-extension-name>.yaml`
`kubectl apply -f <wasm-extension-name>.yaml`

The above CLI commands for creating & deploying a WASM plugin do so using GoogleCloud to store the WASM file for remote access and deploy it with a EnvoyFilter resource. We deploy this way so that the application we are applying this filter to does not need its manifest modified.

(See DeployEnvoyFilterIstio for Deploying using local file).