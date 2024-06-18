# Installing Istio

## Docs:
https://istio.io/latest/docs/setup/getting-started/#download

### Summary of the Above
`curl -L https://istio.io/downloadIstio | sh -`
`cd istio-1.16.1`
`export PATH=$PWD/bin:$PATH`

#### Adding permanently to path
`vim ~/.bashrc`
Paste at bottom:
`export PATH=/home/<user-name>/istio-1.16.1/bin:$PATH`
			
### Continuing Istio Install
`istioctl install --set profile=demo -y`
- Do Not Run this. Provided for reference: `istioctl uninstall -y --purge`

	
*Apply this at your discretion but it's more than likely it's what you want*
kubectl label namespace default istio-injection=enabled
- Do Not Run this. Provided for reference: `kubectl label namespace default istio-injection=disabled`
	
**If you already have pods installed/running, you'll likely need to restart the pods so that the Istio proxy can get injected properly**
`kubectl delete --all pods --namespace=default`

**Verify there are no Istio issues**
`istioctl analyze`