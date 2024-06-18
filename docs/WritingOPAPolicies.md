Testing OPA Policies can be annoying
The playground allows you to test a lot of things BUT some functions don't work (like http.send)

Solution: Install OPA CLI & Test Policies/Data locally

**Installing OPA CLI**	
https://sangkeon.github.io/opaguide/chap2/installandusage.html
---	
**My Test Files:**
`cd OPA/wasm-call-test`
- This contains 2 files. 1 Rego Policy file. 1 file w/ data for the policy. Each of these are .rego files. They can freely be edited and tested. Reference this https://www.openpolicyagent.org/docs/latest/policy-testing/ for test formatting. Essentially, your rego to evaluate is exactly as normal. The other file must include a package name, imports, and the functions must be prefixed w/ "test_". Each Test (yes you can do multiple) is started w/ something like "allow with input as". This checks if the policy you wrote in the other file "allows" the following input.
	
**Run the OPA CLI Test command**
`opa test . -v`