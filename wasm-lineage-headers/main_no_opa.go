// Copyright 2024 Cisco Systems, Inc. and its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"crypto/sha256"
	"fmt"
	"net/url"
	"regexp"
	"strings"

	"github.com/tetratelabs/proxy-wasm-go-sdk/proxywasm"
	"github.com/tetratelabs/proxy-wasm-go-sdk/proxywasm/types"
	"github.com/tidwall/gjson"
)

func main() {
	proxywasm.SetVMContext(&vmContext{})
}

type vmContext struct {
	// Embed the default VM context here,
	// so that we don't need to reimplement all the methods.
	types.DefaultVMContext
}

// Override types.DefaultVMContext.
func (*vmContext) NewPluginContext(contextID uint32) types.PluginContext {
	return &pluginContext{contextID: contextID}
}

type pluginContext struct {
	// Embed the default plugin context here,
	// so that we don't need to reimplement all the methods.
	types.DefaultPluginContext

	contextID uint32
	callBack  func(numHeaders, bodySize, numTrailers int)

}

// Override types.DefaultPluginContext.
func (p *pluginContext) NewHttpContext(contextID uint32) types.HttpContext {
	return &httpHeaders{
		contextID:   contextID,
	}
}

type httpHeaders struct {
	// Embed the default http context here,
	// so that we don't need to reimplement all the methods.
	types.DefaultHttpContext
	contextID   uint32

	labels_cnt_current int
	labels_cnt_total int
	label_set_str string
	valid_set_bool bool
	cas_set uint32
	
}

// Override types.DefaultHttpContext.
func (ctx *httpHeaders) OnHttpRequestHeaders(numHeaders int, endOfStream bool) types.Action {
	hs, err := proxywasm.GetHttpRequestHeaders()
	if err != nil {
		proxywasm.LogCriticalf("failed to get request headers: %v", err)
	}

	for _, h := range hs {
		if h[0] == "baggage" {
			// Process baggage header
			action := ctx.processBaggageHeader(h[1])
			if action != types.ActionContinue {
				return action
			}
		}
	}
	return types.ActionContinue
}

// New function to process baggage header
func (ctx *httpHeaders) processBaggageHeader(baggage string) types.Action {
	// Print Found Baggage & Save to var
	proxywasm.LogInfof("Baggage Header: %s", baggage)
	encoded := baggage

	// Parse the URL-encoded string
	decoded, err := url.QueryUnescape(encoded)
	if err != nil {
		proxywasm.LogCriticalf("Error decoding string: %v", err)
	}
	proxywasm.LogInfof("Decoded: %s", decoded)

	// Define the regex pattern
	pattern := `lineage_label_set=({.*?})`

	// Compile the regex pattern
	r, err := regexp.Compile(pattern)
	if err != nil {
		panic(err)
	}

	// Match the regex against the input string
	match := r.FindStringSubmatch(decoded)

	// Extract the label set from the match
	labelSet_json := match[1]

	proxywasm.LogInfof("labelSet JSON: %s", labelSet_json)

	// Validate Label is in JSON format
	if !gjson.Valid(labelSet_json) {
		proxywasm.LogCritical(`Lineage Label Set is Not in JSON Format`)
	}

	// Get our LabelSetArray from the JSON
	labelSet_json_val := gjson.Get(labelSet_json, "LabelSet")
	proxywasm.LogInfof("LabelSet: %s", labelSet_json_val)

	// Transform Results Object to String
	labelSetStr := labelSet_json_val.String()

	// Parse the string into an array
	labelSetArr := gjson.Parse(labelSetStr).Array()

	// Iterate through the array and remove elements that start with "trace_id="
	filteredLabelSetArr := []gjson.Result{}
	for _, label := range labelSetArr {
		if !strings.HasPrefix(label.String(), "trace_id=") {
			filteredLabelSetArr = append(filteredLabelSetArr, label)
		}
	}
	proxywasm.LogCriticalf("Filtered LabelSet Array: %v", filteredLabelSetArr)

	// Reconstitute String for Hash
	filteredLabelSetStr := "["
	separator := ","
	for i, label := range filteredLabelSetArr {
		if i > 0 {
			filteredLabelSetStr += separator
		}
		filteredLabelSetStr += `"`+label.String()+`"`
	}
	filteredLabelSetStr += "]"
	
	proxywasm.LogCriticalf("Filtered LabelSet String: %v", filteredLabelSetStr)

	labelSetStr = filteredLabelSetStr
	ctx.label_set_str = labelSetStr
	
	// Attempt to get Label from Cache
	value, cas, err := GetLabelFromCache(labelSetStr)
	proxywasm.LogInfof("Retrieved Value from cache: %s", string(value))
	ctx.cas_set = cas
	if err != nil {
		proxywasm.LogCriticalf("Error on Getting Label from Cache: %v, %v", err, cas)
	}

	// Default ValidSet to true
	ctx.valid_set_bool = true

	// If LabelSet not in cache:
	// Check if Individual Label in Cache
		// If not -> Dispatch Http to get validity status & cache
	if value == nil {
		proxywasm.LogWarn("LabelSet Not in Cache. Checking Individual Label Validity & Caching")
		
		// Parsing Individual Labels
		var labelSet_Result_ar = gjson.Parse(labelSetStr).Array()

		// Parsing Individual Labels
		// var labelSet_Result_ar = labelSet_json_val.Array()

		// SET labels_cnt_total to number of labels
		ctx.labels_cnt_total = len(labelSet_Result_ar)
		proxywasm.LogInfof("Number of Individual Labels: %d", ctx.labels_cnt_total)
		
		// Set labels_cnt_current to 0
		ctx.labels_cnt_current = 0
		proxywasm.LogInfof("Individual Labels Processed: %d", ctx.labels_cnt_current)

		// For Each Label
		for _, labelVal := range labelSet_Result_ar {
			// Get the label
			var labelStr = labelVal.String()
			proxywasm.LogInfof("Individual Label: %s", labelStr)
			
			// Attempt to get Label from Cache
			labelStrToHash:= `"` + labelStr + `"`
			value, cas, err := GetLabelFromCache(labelStrToHash)
			if err != nil {
				proxywasm.LogCriticalf("Error on Getting Label from Cache: %v, %v", err, cas)
			}

			// If doesn't exist in cache
			if value == nil {
				proxywasm.LogWarn("Label not in cache. Checking Validity.")

				// Prepare & Dispatch HTTP call to validation service
				// jsonBody := fmt.Sprintf(`{"input": {"label": "%s", "cas": %d}}`, labelStr, cas)

				// path := "/v1/data/main/result"
				// headers := [][2]string{
				// 	{":path", path},
				// 	{":method", "POST"},
				// 	{":authority", ""},
				// 	{"Content-Type", "application/json"},
				// }

				// body := []byte(jsonBody)

				proxywasm.LogInfo("Dispatching Call to OPA")

				// if _, err := proxywasm.DispatchHttpCall("opa", headers, body, nil, 100000, ctx.httpCallRequestCallback); err != nil {
				// 	proxywasm.LogCriticalf("dispatch httpcall failed: %v", err)
				// }

				ctx.mockHttpCallRequestCallback(labelStr, "Valid", ctx.cas_set)


			} else {
				// Does Exist in Cache
				// Get Validity & AND w/ current validity

				// Get the string of the label (everything but the last byte)
				if !gjson.Valid(string(value)) {
					proxywasm.LogCritical(`retrieved value is NOT in JSON Format`)
				}

				labelStr := gjson.Get(string(value), "label").String()

				// Get the finaly byte that states whether the LabelSet is Valid or not
				validLabel := gjson.Get(string(value), "valid").Bool()

				// Toggle set validity
				if !validLabel {
					ctx.valid_set_bool = false
				}

				// Print Label and Validity
				proxywasm.LogInfof("Single Label in Cache: %s, Validity: %t", labelStr, validLabel)

				// If we have processed every individual label, Evaluate the LabelSet
				ctx.labels_cnt_current++
				proxywasm.LogInfof("Individual Labels Processed: %d", ctx.labels_cnt_current)
				if ctx.labels_cnt_current == ctx.labels_cnt_total{

					// Cache labelset
					SetLabelInCache(labelSetStr, ctx.valid_set_bool, ctx.cas_set)

					// Ends Request if Invalid
					if !ctx.valid_set_bool {
						body := "Invalid Request: Access Forbidden"
						proxywasm.LogInfo(body)
						if err := proxywasm.SendHttpResponse(403, [][2]string{}, []byte(body), -1); err != nil {
							proxywasm.LogErrorf("Failed to respond to invalid request: %v", err)
						}
						return types.ActionPause
					}
				}
			}
		}

		// Pauses Request Processing if we didn't have the set in our cache,
		// allowing DispatchedHttp calls to return validity status and possibly continue
		if ctx.labels_cnt_current != ctx.labels_cnt_total{
			return types.ActionPause
		}

	} else {
		// If already in cache, print
		proxywasm.LogInfo("LabelSet already Cached")

		if !gjson.Valid(string(value)) {
			proxywasm.LogCritical(`retrieved value is NOT in JSON Format`)
		}

		// Get the string of the label
		labelSetStr := gjson.Get(string(value), "label").String()

		// Get the boolean that states whether the LabelSet is Valid or not
		validSet := gjson.Get(string(value), "valid").Bool()

		// Set validity
		if !validSet {
			ctx.valid_set_bool = false
		}

		proxywasm.LogInfof("LabelSet: %s, Validity: %t", labelSetStr, validSet)

		// Ends Request if Invalid
		if !ctx.valid_set_bool {
			body := "Invalid Request: Access Forbidden"
			proxywasm.LogInfo(body)
			if err := proxywasm.SendHttpResponse(403, [][2]string{}, []byte(body), -1); err != nil {
				proxywasm.LogErrorf("Failed to respond to invalid request: %v", err)
			}
			return types.ActionPause
		}
	}
	return types.ActionContinue
}

// Override types.DefaultHttpContext.
func (ctx *httpHeaders) OnHttpStreamDone() {
	proxywasm.LogInfof("%d finished", ctx.contextID)
}

// Evaluates valid_set_bool
func (ctx *httpHeaders) EvaluateSetValidity() {
	proxywasm.LogInfof("Set Validity is: %v", ctx.valid_set_bool)

	if ctx.valid_set_bool {
		proxywasm.LogInfo("Valid Set. Resuming Request.")
		proxywasm.ResumeHttpRequest()
		return

	} else {
		body := "Invalid Request: Access Forbidden"

		proxywasm.LogInfo(body)

		if err := proxywasm.SendHttpResponse(403, [][2]string{}, []byte(body), -1); err != nil {
			proxywasm.LogErrorf("Failed to respond to invalid request: %v", err)
		}
	}
}

func (ctx *httpHeaders) mockHttpCallRequestCallback(labelStr string, labelValidityResponseStr string, labelCas uint32){
	proxywasm.LogCritical("MOCKING mockHttpCallRequestCallback")
	// Create a static response
    staticResponse := fmt.Sprintf(`{"result": {"response": {"label": ["%s", "%s", %d]}}}`, labelStr, labelValidityResponseStr, labelCas)

	bodyString := string(staticResponse)
	proxywasm.LogCriticalf("Validation Service Reponse: %v", bodyString)

	// Validate & Parse JSON
	if !gjson.Valid(bodyString) {
		proxywasm.LogCritical(`Validation Service Response NOT in JSON Format`)
		return
	}

	// Get our Label and Valid Status Array from the JSON
	label_valid_ar := gjson.Get(bodyString, "result.response.label").Array()

	// Check if the array has the expected length
	if len(label_valid_ar) < 3 {
		proxywasm.LogCritical("Validation Service Response has an unexpected format")
		return
	}

	// Consume Responses values Properly
	label_str := label_valid_ar[0].String()
	label_validity_response_str := label_valid_ar[1].String()
	label_cas := uint32(label_valid_ar[2].Uint())
	// Create boolean for setting cache value
	label_valid := false
	// Evaluate response validity
	if label_validity_response_str == "Valid" {
		label_valid = true
	}

	// Save label to cache IF validated cas is equal to or newer than current cas
	// Get Label from cache for current cas
	value, cas, err := GetLabelFromCache(label_str)
	if err != nil {
		proxywasm.LogCriticalf("Error on Getting Label from Cache: %v, %v", err, cas)
	}
	// If we couldn't retireve the label from cache OR
	// if our 'cas' is >= to the 'cas' of the item in the cache
	// Set the Label in the cache
	if cas == 0 || label_cas >= cas {
		SetLabelInCache(label_str, label_valid, label_cas)
	} else { 
		//Executes when the cached label is newer than the processed label
		
		// We will Set label_valid to returned value from cache

		// Validate JSON
		if !gjson.Valid(string(value)) {
			proxywasm.LogCritical(`retrieved value is NOT in JSON Format`)
		}

		// Get the boolean that states whether the LabelSet is Valid or not
		cached_label_valid := gjson.Get(string(value), "valid").Bool()
		label_valid = cached_label_valid
	}

	// Set LabelSet boolean
	if !label_valid {
		ctx.valid_set_bool = false
	}

	// Incremement processed label count
	ctx.labels_cnt_current++
	proxywasm.LogInfof("Individual Labels Processed: %d", ctx.labels_cnt_current)

	// If we've processd every label,
	if ctx.labels_cnt_current == ctx.labels_cnt_total{
		proxywasm.LogInfo("All Individual Labels Processed")

		// Save label_set to cache IF validated cas is equal to or newer than current cas
		// Get label_set from cache for current cas
		_, cas, err := GetLabelFromCache(label_str)
		if err != nil {
			proxywasm.LogCriticalf("Error on Getting Label from Cache: %v, %v", err, cas)
		}
		if cas != 0 || ctx.cas_set >= cas {
			// Cache labelset
			SetLabelInCache(ctx.label_set_str, ctx.valid_set_bool, ctx.cas_set)
		}

		ctx.EvaluateSetValidity()
		
	}
}

func GetLabelFromCache(label_str string) (value []byte, cas uint32, err error) {
    // Hash String
    hash := sha256.Sum256([]byte(label_str))

    // Turn hash []byte into string
    labelSetKey := fmt.Sprintf("%x", hash)

    // Attempt to get the value of the hash
	return proxywasm.GetSharedData(labelSetKey)
}

func SetLabelInCache(label_str string, valid bool, cas uint32) {
	// Check if label_str starts with [ and ends with ] to check if we are caching a whole set or an individual label
    match, _ := regexp.MatchString(`^\[.*\]$`, label_str)
    if !match {
        // Prepend and append " to label_str
        label_str = `"` + label_str + `"`
    }

	data_str := `{"label":` + label_str + `,"valid":` + fmt.Sprintf("%t", valid) + `}`
	proxywasm.LogInfof("Caching the Following string: %s", data_str)
	data := []byte(data_str)

	// Hash String
    hash := sha256.Sum256([]byte(label_str))

    // Turn hash []byte into string
    labelSetKey := fmt.Sprintf("%x", hash)

	// Sets Shared Data at hash value key
	if err := proxywasm.SetSharedData(labelSetKey, data, cas); err != nil {
		proxywasm.LogCriticalf("Error on Saving Label to Cache: %v", err)
	} else {
		proxywasm.LogInfof("Label: %s, Validity: %v saved to cache", string(label_str), valid)
	}
}