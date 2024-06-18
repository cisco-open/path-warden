# Copyright 2024 Cisco Systems, Inc. and its affiliates
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

import os
from functools import wraps
from flask import request
from opentelemetry import trace, context, baggage
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import SERVICE_NAME, SERVICE_VERSION, Resource
from opentelemetry.baggage.propagation import W3CBaggagePropagator
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
import json


# Utility Function to get Specific Header from Request
def get_header_from_flask_request(key: str):
    return request.headers.get_all(key)


# Initialize OTel Tracing
def initialize_tracing(exporting_traces: bool = True, export_endpoint: str = "http://localhost:4318/v1/traces"):
    resource = Resource(attributes={SERVICE_NAME: os.getenv("SERVICE_NAME"),
                                    SERVICE_VERSION: os.getenv("SERVICE_VERSION")}) 

    provider = TracerProvider(resource=resource)

    if exporting_traces:
        #Export Endpoint & Processor
        processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=export_endpoint))
        provider.add_span_processor(processor)

    trace.set_tracer_provider(provider)

# Decorator to Enable OTel Tracing on an Endpoint
# Will extract and use the trace context from header
# for its own spans (see add_tracing_header function)
def enable_tracing(span_name: str = "default_svc_src", label_with_trace_id: bool = False):
    def inner(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            tracer = trace.get_tracer(__name__)

            #Retrieving Propogated Context
            traceparent = get_header_from_flask_request("traceparent")

            #If we have a parent trace, get context
            if traceparent:
                carrier = {"traceparent": traceparent[0]}
                ctx = TraceContextTextMapPropagator().extract(carrier)

                #Attach ctx to context
                token = context.attach(ctx)

            with tracer.start_as_current_span(span_name):
                initialize_lineage_label_set()

                if label_with_trace_id:
                    save_trace_id_label()

                res = func(*args, **kwargs)

            return res
        return wrapper
    return inner


# Saves the current trace_id as a label to the label set
# current (most recent) trace_id will always be at index 0
# if current trace_id is not equivlent to the label at index 0 (trace_id or not)
# it gets inserted at index 0.
# This ensures that even broken traces all have their id's recorded.
def save_trace_id_label():
    # Get OpenTelemetry TraceID
    current_span_context = trace.get_current_span().get_span_context()
    
    # Retrieve the trace ID from the span context
    trace_id = current_span_context.trace_id

    # Verify we have enabled tracing
    if trace_id:
        # Convert the trace ID to a human-readable string
        trace_id_hex = format(trace_id,"032x")
        print(f'Current trace ID: {trace_id_hex}')
        trace_id_lbl = 'trace_id='+trace_id_hex
        
        #Get the curr_lineage_label_set
        curr_lineage_label_set = get_lineage_label_set()
        #If we have a curr_lineage_label_set
        if curr_lineage_label_set:
            #Load it as JSON
            lls = json.loads(curr_lineage_label_set)
            #if the first value in the array is NOT equal to the current trace_id
            if not lls["LabelSet"][0] == trace_id_lbl:
                #Add trace_id to lineage label set
                add_lineage_label(trace_id_lbl,prepend=True)

        #Given we don't have a curr_lineage_label_set
        else:
            #Simply add the trace_id_lbl
            add_lineage_label(trace_id_lbl)


# Adds and Returns TraceParent header to any existing Headers
# This function can be used to add the trace context to the headers 
# of an outgoing HTTP request, allowing the receiving service to extract 
# and use the trace context for its own spans (see enable_tracing Decorator)
def add_tracing_header(headers: dict = {}):
    #Injecting Context Information into Header
    carrier = {}
    TraceContextTextMapPropagator().inject(carrier)
    if "traceparent" in carrier:
        header = {"traceparent": carrier["traceparent"]}

        #Adding Context Info to Headers
        headers.update(header)

    return headers


# function to Get Lineage Labels in Baggage and set to Context
def initialize_lineage_label_set():
    #Retrieving Propagated Baggage
    bg = get_header_from_flask_request("baggage")

    #If we have baggage, get it
    if bg:
        bags = {"baggage": bg[0]}
        bagCtx = W3CBaggagePropagator().extract(bags)
        
        #Attach ctx to context
        token = context.attach(bagCtx)


# Add label to lineage in OTel Baggage
def add_lineage_label(label: str, headers: dict = {}, prepend: bool = False):
    #get lineage_label_set from baggage
    lineage_label_set = baggage.get_baggage("lineage_label_set")
    if not lineage_label_set:
        lineage_label_set = '{ "LabelSet" : [] }'

    #append to lineage_label
    # lineage_label_set += label
    json_obj = json.loads(lineage_label_set)

    if prepend:
        json_obj["LabelSet"].insert(0,label)
    else:
        json_obj["LabelSet"].append(label)

    lineage_label_set = json.dumps(json_obj)

    #set in baggage
    ctx = baggage.set_baggage("lineage_label_set",lineage_label_set)
    token = context.attach(ctx)

    #inject into carrier
    carrier = {}
    W3CBaggagePropagator().inject(carrier)

    #Adding Context Info to Headers
    header = {"baggage": carrier["baggage"]}
    headers.update(header)

    return headers, token


# Returns current Lineage Label Set as a String
def get_lineage_label_set():
    res = baggage.get_baggage("lineage_label_set")
    return res if res is not None else ''


# Sets current Lineage Label Set to input Dictionary
def set_lineage_label_set(lineage_label_set: str, headers: dict = {}):
    #Override Existing label set
    ctx = baggage.set_baggage("lineage_label_set", lineage_label_set)
    token = context.attach(ctx)

    #inject into carrier
    carrier = {}
    W3CBaggagePropagator().inject(carrier)

    #Adding Context Info to Headers
    header = {"baggage": carrier["baggage"]}
    headers.update(header)

    return headers, token


def set_request_lineage_baggage(labels: str):
    ctx = baggage.set_baggage("Request-Labels", labels)
    token = context.attach(ctx)

    #inject into carrier
    carrier = {}
    W3CBaggagePropagator().inject(carrier)

    return ctx

def get_request_lineage_baggage():
    request_labels = baggage.get_baggage("Request-Labels")
    return request_labels if request_labels is not None else ''


def set_response_lineage_baggage(labels: str):
    ctx = baggage.set_baggage("Response-Labels", labels)
    token = context.attach(ctx)

    #inject into carrier
    carrier = {}
    W3CBaggagePropagator().inject(carrier)

    return ctx

def get_response_lineage_baggage():
    response_labels = baggage.get_baggage("Response-Labels")
    return response_labels if response_labels is not None else ''


# Injects Lineage Label Set into Span Attributes
def add_lineage_to_attributes():
    lineage_label_set = get_lineage_label_set()
    current_span = trace.get_current_span()
    current_span.set_attribute("lineage_label_set", lineage_label_set)

def set_request_lineage_attribute():
    request_labels = get_request_lineage_baggage()
    current_span = trace.get_current_span()
    current_span.set_attribute("Request_Labels", request_labels)

def set_response_lineage_attribute():
    response_labels = get_response_lineage_baggage()
    current_span = trace.get_current_span()
    current_span.set_attribute("Response_Labels", response_labels)


# Clears Context of Attached Token
def undo_label_change(token: object):
    try:
        context.detach(token)
    except:
        print("Error Detaching Token from Context.")
