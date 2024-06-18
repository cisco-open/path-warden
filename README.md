# Path Warden
This project looks to improve the security in cloud systems. Specifically, it demonstrates:
1) A system for tracing the Lineage of data moving through services
2) A strategy for storing the Lineage information for a piece of data
3) An enforcement point for pieces of data based on their Lineage
4) A mechanism for evaluating Polices that are being enforced

This design looks at solving these issues in dynamically constructed edge systems.

## Overview
So far, there are 4 key components to this system:

1. Lineage Propagation: This refers to the propagation of labels related to a piece of data moving through a set of services. The entirety of this set of labels is the `Data Lineage`. The original source of the data is the `Data Provenance`. The goal of lineage propagation is to save the original Data Provenance and concatenate onto it each processing step the data undergoes to generate a Data Lineage that can be evaluated at each proceeding step and ultimately stored for future reference.

2. Lineage Storage: The Data Lineage propagated throughout the system for each series of actions is stored so that it can be referenced, altered, etc later on.

3. Policy Enforcement: Making use of the propagated labels even prior to the data's ultimate destination, the system enforces data management policies at each service in the chain. Currently, enforcement results in pass/fail and either allows or blocks a request. This enforcement module makes sure to cache evaluations of labels to reduce overhead.

4. Policy Evaluation: At the enforcement points, not-yet-evaluated labels are sent off to a separate service to be evaluated for their pass/fail status. Otherwise, previously cached values are simply retrieved.

#### Key Technologies & Concepts
- Label Propagation built using OpenTelemetry
- Enforcement done in Istio Sidecars using Go Wasm Plugin
- Policies written in Rego & evaluated using OPA
- It is necessary that developers instrument their applications with our lineage propagation (tracing) libraries. However, these libraries desire to be incredibly lightweight and easy to use.

### Current State
#### Summary of System
1. Label Propagation is achieved using Open Telemetry's Baggage Concept. We store a Label Set in JSON format at the baggage labeled `lineage_label_set`.
2. Label Storage is achieved in myqsql by creating a separate table whose primary key is equivalent to the primary key of the table one is labeling. The current example shows this being done using a small library of functions in python. This allows enabling/disabling the labeling of data in existing systems without updating/destroying existing tables.
3. We enforce data label policies in Istio's Service Mesh sidecars using a Go-Wasm Plugin. Reference Istio & the Go Wasm SDK for more information on those.
4. We write policies for labels in Rego and evaluate them in OPA. The policies are currently written as part of the OPA sidecar manifest which creates the container in the service's pod.

#### Directory Summary

- Account-CRUD is a Demo App with basic CRUD functionality connected to a MySQL DB created for the purposes of testing the various lineage label propagation & enforcement technologies

- wasm-lineage-headers contains all files relevant to the development of the plugin written for the Istio sidecar which parses, validates & caches LabelSets.

##### (Provided as Reference)
- OTel Basic contains a Series of Services used to Initially Develop & Test OpenTelemetry. Generally, the functionality created here is less mature than that in account-CRUD. These files are provided for general reference.

- OPA contains files relevant to testing & developing the OPA implementations. Ultimately, the plug-and-play solution of OPA for Istio was not used however these files are provided as reference.

#### Implementation Summary
As mentioned before, account-CRUD contains the demo of this system. See the README in that directory.

### Pre-reqs
- minikube installed on system
- Istio installed on Minikube cluster
- gsutils installed
- Go installed
- tinygo installed

#### Recommended Additional Software
- VSCode Server on instance for remote IDE access

#### Getting Up and Running with Cluster on EC2 instance
1. Create Tunnel from terminal: `ssh -L 8080:localhost:8080 <remote-host>`
2. Launch VSCode server: `code-server --auth none`
3. Open new Terminal on local machine & ssh: `ssh <remote-host>`
4. Create Tunnel from EC2 instance to minikube gateway `minikube tunnel`
5. Launch New Terminal & ssh which serves as your working cli

#### Accounts Required For:
- GoogleCloud: Remotely storing & Deploying the Wasm Plugin using a GC bucket. Archived files show how it can be deployed with a local file (see envoyFilter.yaml). Deploying EnvoyFilter with GoogleCloud means saving it to a ConfigMap and injecting ConfigMap into app deployment. See docs for more information.
- Docker: if you want to push images. Not necessary.
- Use Jaeger for OpenTelemetry trace visualization

##### Early Steps
In addition to connecting & establishing the minikube tunnel, early on you will need to do the following things:
1. Should you ever need to edit/redeploy the wasm-lineage-headers plugins (which is very likely), you'll need to make a google cloud account, and a bucket to contain the wasm file. Reference the git linked at the top of `WASM-Label-Lineage.md`.

### Future Work
- More Languages supported for Label Propagation
- More Databases supported for Label Storage
- Integrate OPAL for simpler Policy distribution
- More Policies written for particular labels
