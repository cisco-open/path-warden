# User Account CRUD

Based On:
<https://www.kdnuggets.com/2021/02/deploy-flask-api-kubernetes-connect-micro-services.html>

---

## Editing the CRUD

### After Editing the .py Flask file

`docker build . -t <dev-acct>/flask-user-accounts-api`
`kubectl delete -f flaskapp-deployment.yml`
`kubectl apply -f flaskapp-deployment.yml`

#### Get API access URL

`minikube service flask-service --url`

### Modifying the Database

- Add SQL instruction to ConfigMap section in mysql Deployment file

### After Editing any of the mysql Manifest Files OR if you'd like to reset the database

`kubectl delete -f mysql-pv.yml`
`kubectl apply -f mysql-pv.yml`
`kubectl delete -f mysql-deployment.yml`
`kubectl apply -f mysql-deployment.yml`

#### For Reference

##### Creating Mysql Pod With Preloaded Database

- <https://medium.com/@AbhijeetKasurde/creating-mysql-pod-with-preloaded-database-2c01c002fdc3>

---
If K8s was Deleted, you must apply various yml configurations
Applying Configurations
`kubectl apply -f .`
`kubectl apply -f flaskapi-secrets.yml`
`kubectl apply -f mysql-pv.yml`
`kubectl apply -f mysql-deployment.yml`
`kubectl apply -f flaskapp-deployment.yml`
