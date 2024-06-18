# MySQL Database
## 1. Description
The database of choice within this project is MySQL, which will be running as a standalone service within the cluster.
Therefore, this directory will contain all the required files to configure and deploy the MySQL service.

## 2. Deployment
In order to ensure the good functioning of this component service the following steps should be undertaken in the specified order:
 - kubectl apply -f _./mysql-secrets.yml_
 - kubectl apply -f _./mysql-persistenvolume.yml_
 - kubectl apply -f _./mysql-persistenvolumeclaim.yml_
 - kubectl apply -f _./mysql-deployment.yml_
 - kubectl apply -f _./mysql-configmap.yml_
 - kubectl apply -f _./mysql-service.yml_

## 2. Automated Service Start
This service can be brought up automatically by running:
- ./start.sh
