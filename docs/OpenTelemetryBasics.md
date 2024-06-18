# Open Telemetry Basics
Here we provide resources & code snippets about Open Telemetry. All of the basics learned here were applied and consildated into a handful of easy to use functions in `lineage_propagation.py`.

---
I have found Aspecto's articles on OpenTelemetry to be the most helpful. Here are two:

1. https://www.aspecto.io/blog/distributed-tracing-with-opentelemetry-collector-on-kubernetes/
2. https://www.aspecto.io/blog/opentelemetry-collector-agent-on-kubernetes/

Lightstep has also been very useful, particularly this article/repo:
1. https://lightstep.com/blog/opentelemetry-for-python-the-hard-way
2. https://github.com/lightstep/opentelemetry-examples/tree/main/python/opentelemetry/manual_instrumentation

---
### NOTE
I use Aspecto's visualization tools instead of Jaeger's as they are a bit more intuitive for me. Doing so requires an Aspecto API key and thus an Aspecto user account.
---

# Deploying OTel Resources
Included here & in the provided files is reference to and instructions for exporting traces to Aspecto. You must have an account there & retrieve your API key to use Aspecto's visualization.

* Deploy Gateway for Otel (Creates opentelemetry namespace)
`kubectl apply -f gateway.yml`

* Create Secret of Aspecto API Key in opentelemetry namespace
- Switch Namespace to opentelemetry
`kubectl config set-context --current --namespace=opentelemetry`

* Create secret
`kubectl create secret generic aspecto --from-literal=api-key=<your-api-key>`
    
* Verify Secret Created
`kubectl get secrets -o json`
    
* Switch namespace to default
`kubectl config set-context --current --namespace=default`
    
* Deploy ConfigMap for Sidecar
`kubectl apply -f otel-agent-config.yml`

* Deploy Application and Sidecar: 
`kubectl apply -f <your-manifest>.yml`

* Deploy Jaeger all in one to consume Otel data
`kubectl apply -f jaeger.yml`

* Open Tunnel to see JaegerUI
`minikube tunnel`

* Jaeger url
`localhost:16686/search`

* Aspecto
https://www.aspecto.io/	

---
# Instrumenting Flask 
* Exporter Docs Link: https://opentelemetry.io/docs/instrumentation/python/exporters/#using-http

``` python
#Imports
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource

#Create Resource -> I use enviornment variables defined in deployment to get the SERVICE_NAME
resource = Resource(attributes={
    SERVICE_NAME: os.getenv("SERVICE_NAME")
})
#Create Provider using Resource
provider = TracerProvider(resource=resource)

#Create Processor using OTLPSpanExporter for Http
#Using localhost b/c OTEL Collector Agent is in same pod just different container
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4318/v1/traces"))

#Add Processor to Provider
provider.add_span_processor(processor)

#Set Trace's Provider to created Provider
trace.set_tracer_provider(provider)

#Creating a span
	#Get Tracer from Trace
	tracer = trace.get_tracer(__name__)
	
	#Define Span
	with tracer.start_as_current_span("rootSpan"):
		#Indent code in span below
```

---
# Propagating Trace
``` python
from flask import request
from opentelemetry import context

from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
#IF YOU ARE PROPAGATING DOWN
from opentelemetry import propagators

# Utility function
def get_header_from_flask_request(request, key):
    return request.headers.get_all(key)

# ...

#Retrieving Propogated Context
traceparent = get_header_from_flask_request(request, "traceparent")
#If we have a parent trace, get context
if traceparent:
    carrier = {"traceparent": traceparent[0]}  
    ctx = TraceContextTextMapPropagator().extract(carrier)
    #Attach ctx to context
    token = context.attach(ctx)

# ...

# Assuming we've started a span with: 
# `with tracer.start_as_current_span("rootSpan"):`

#Necessary if Propagating Downwards
#Propogating Context
carrier = {}
TraceContextTextMapPropagator().inject(carrier)
header = {"traceparent": carrier["traceparent"]}

# ...

#After return statement/end of code
#Check for Attached Context and Detach if necessary            
        finally:
            try:
                context.detach(token)
            except:
                print("No Context to Detach")
```

---
# Baggage Creation & Propagation

``` python
#Creating Baggage
#import
from opentelemetry import trace, context, baggage
from opentelemetry.baggage.propagation import W3CBaggagePropagator
from opentelemetry.context import attach, detach

#Start Trace: `with tracer.start_as_current_span("rootSpan"):`
# Set Baggage & Attach Context Token
        ctx = baggage.set_baggage("bgName","bgValue")
        token = attach(ctx)

    
# Inject into Carrier
    # Carrier has likely been made b/c we use it for ParentTrace context BUT in case it hasn't include:
    carrier = {}
    
    #Inject
    W3CBaggagePropagator().inject(carrier)
    
#Add to headers
header = {"traceparent": carrier["traceparent"], "baggage": carrier["baggage"]}
    
# Do Things...

# Detach Token
detach(token)
```

``` python
#Consuming Baggage
#import
from opentelemetry import trace, context, baggage
from opentelemetry.baggage.propagation import W3CBaggagePropagator
from opentelemetry.context import attach, detach

#Define Get Header from Request func (probably already defined if doing parent tracing)
def get_header_from_flask_request(request, key):
    return request.headers.get_all(key)

#Retrieving Propagated Baggage
bg = get_header_from_flask_request(request, "baggage")

#Getting Baggage Context & Attaching to context
#If we have baggage, get it
    if bg:
        bags = {"baggage": bg[0]} 
        bagCtx = W3CBaggagePropagator().extract(bags)
        #Attach ctx to context
        token = attach(bagCtx)

# Do Things...

# Detach Token
detach(token)
```

* NOTE: If you don't want to actually log traces out to otlp and instead just use the traces do the following:
1. Comment out Otel Collector Agent from deployment files and redeploy
2. Remove deployment of Gateway
`kubectl delete -f gateway.yml`
3. Remove Jaeger
`kubectl delete -f jaeger.yml`
4. Remove/Comment out BatchSpanProcessor (found in python)
- processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4318/v1/traces"))
- provider.add_span_processor(processor)
