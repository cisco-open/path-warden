# Flask API

## 1. Description

Base application for API Server

## 2. Deployment

In order to ensure the good functioning of this component service the following steps should be undertaken in the specified order:

- Deploy MySQL database (see _db/README.md_)
- `kubectl apply -f ../OTel_Basic/otel-agent-config.yml`
- `docker build . -t <devacct>/flask-api-server`
- `kubectl apply -f ./flaskapi-deployment.yml`
- `kubectl apply -f ./laskapi-configmap.yml`
- `kubectl apply -f ./flaskapi-service.yml`

## 3. Automated Build

Please check the flaskapi-deployment.yml, line 21, and fill in with your account username by which you're going to build the docker image for the flask api server.
The default _devacct_ value is _$USER_.
The image can be automatically build by running:

- ./build.sh _devacct_

## 4. Automated Start

This service can be brought up automatically by running; the script doesn't include OpenTelemetry Agent Configmap:

- ./start.sh
