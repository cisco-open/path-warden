# Setting up the default OPA distribution with Istio

This document outlines setting up the default OPA distribution with Istio. Ultimately, the plug-and-play solution of OPA for Istio was not used however these instructions are provided as reference.

## NOTE

We ultimately did NOT proceed with the default OPA-Istio distribution. It places a sidecar at each pod (which we still do) however, it also intercepts every call. We would rather intercept the calls at the WASM Plugin and make validation requests to the opa sidecar only if necessary. This default distribution is created with either OPA-Filter.yml or quickstart.yml. The difference between these two files is the evaluation policy.

The default tutorial this document is based off can be found here:
<https://www.openpolicyagent.org/docs/latest/envoy-tutorial-istio/>

---
**We are going to start w/ an empty Minikube Environment**
`minikube start`

**Install Istio**
`istioctl install --set profile=demo -y`
`kubectl label namespace default istio-injection=enabled`
`istioctl analyze`

**Enable injection for OPA**
`kubectl label namespace default opa-istio-injection="enabled"`

**Applying OPA's Resources (files are in /OPA)**
`kubectl delete -f OPA-Filter.yaml`
`kubectl apply -f OPA-Filter.yaml`

**MAKE SURE TO SET UP TUNNEL IN OTHER TERMINAL**
`minikube tunnel`

* Check that the relevant SVC shows an external IP
* `kubectl get service identify-svc-lb`

## Testing OPA-Filter.yaml Filter on Account-CRUD App

* NOTE: This `curl` command wont' work. Why? -> Filter requires baggage header. Curling app directly means there no baggage entering the account-CRUD app.
* TLDR: Don't use: `curl $(minikube service flask-service --url)/users`

* INSTEAD: You MUST hit Identify Svc -> /users Endpoint. Either of these work:
* `curl $(kubectl get svc identify-svc-lb -o jsonpath='{.status.loadBalancer.ingress[0].ip}')/users`
* `curl $(minikube service identify-svc-lb --url)/users`
  
* NOTE: The intended behavior is that the response to this request alternates b/w Error 500 & the actual response (user information). The filter currently makes a request to the 'eval-policy-true-svc' to verify a label's access. We alternate b/w labels 1 & 2 (allowed/disallowed) thus the filter must alternate between allowing requests and not.

* Editing Flow: Of course you'll need to redploy your manifests. You'll also restart the deploy to clear the cache. Then watch the pods to make sure all containers in pod come alive.
`kubectl delete -f OPA-Filter.yaml`
`kubectl apply -f OPA-Filter.yaml`
`kubectl rollout restart deployment -l app=flaskapi`
`kubectl get pods -w`
`curl $(minikube service identify-svc-lb --url)/users`

---

## Excluding Pods from OPA Filtering

This is a 2 step Process

1. In the MutatingWebhookConfiguration manifest, on the same level as "namespaceSelector" paste this:

  ```yaml
      objectSelector:
        matchExpressions:
        - key: sidecar.opa-istio.io/inject
          operator: NotIn
          values:
          - "false"
  ```

1. In any pod you don't want the OPA filter to apply in, go to their Deployment and add this to their list of labels:

  ```yaml
  sidecar.opa-istio.io/inject: "false"
  ```

---

> [!NOTE]  
> OPA Filters MUST allow Healthcheck requests otherwise k8s thinks pods aren't deploying correctly

---

> [!TIP]
> This is the format for getting the logs of the Opa Proxy: `kubectl logs <POD-NAME> -c=opa-istio`

## Caching is a Problem

OPA Sidecar will Cache Evaluations EVEN IF you delete the yaml. You have to restart the sidecar as well!

To do this for the Account CRUD App: `kubectl rollout restart deployment -l app=flaskapi`

To do this for every deployment:
`kubectl rollout restart deploy`
