Here we outline how to use the functions found in `lineage_propagation.py`. See `flaskapi.py` for implementation example.

``` py
# THIS PYTHON CODE WILL NOT RUN. IT IS NOT DESIGNED TO RUN.

#Import Module
from lineage_propagation import *

#Initialize Tracing for every endpoint
    #Parameters that can be configured:
        # exporting_traces: Boolean - toggles trace exporting
        # export_endpoint: str - provide url of Otel Collector Agent(defaulted to Otel default)
    initialize_tracing()
	
#Enable Tracing on a single Endpoint 
	#Beneath app.route("/")
	#If no string is provided, will use default string
	@enable_tracing("call-endpt-svc-V2.3")
	
	#Add Parent Trace information to Header and Returns updated Header
	#Does not require existing headers to be passed in
	headers = add_tracing_header(headers)
	
	#Adds passed in Lineage Label to headers and Returns:
		#updated Header
		#Token that can be used to undo Label Append
	#Does not require existing headers to be passed in
	headers, linCtxToken = add_lineage_label("call-endpt-v2.3", headers)
	
	#Undo changes related to Token passed in
	#Must pass in token
	undo_label_change(linCtxToken)

	#Get the current Label Set
	my_var = get_lineage_label_set()
	
	#Override Label Lineage to Passed in String
	#Does not require the existing headers to be passed in
	headers, linCtxToken = set_lineage_label_set("call-endpt-WARNING", headers)
	
	#Adds Lineage Label Set to Span Attributes
	add_lineage_to_attributes()
	
	
	#REMINDER: You MUST Pass in headers to next response
	#Pass headers in request
	    response = requests.get(endpoint, headers=headers)

```

---
* NOTES
- Your final endpoint does NOT require you to "add_tracing_header"
- Your final endpoint DOES require you to "enable_tracing" in order to capture all propagated baggage
- You CAN add Lineage Labels at the final endpoint
- You CANNOT propagate attributes

---
# Adding Tracing to an existing Service: Beyond the Instrumentation
Beyond the instrumentation of the service itself, if you want the OTel visualizations, you'll have to ensure that you have an OTel container:

``` yaml
- name: otel-agent
    image: otel/opentelemetry-collector:latest
    command:
    - '/otelcol'
    - '--config=/conf/otel-agent-config.yaml'
    volumeMounts:
    - name: otel-agent-config-vol
        mountPath: /conf
    resources:
    requests:
        memory: '64Mi'
        cpu: '250m'
    limits:
        memory: '128Mi'
        cpu: '500m'
```

Make sure to include these environment variables in your app's container otherwise Otel won't export
```yaml
- name: SERVICE_NAME
    value: <your-svc-name>
- name: SERVICE_VERSION
    value: <your-svc-version>
```

See the articles provided in `OpenTelemetryBasics` for more info about manifest files.