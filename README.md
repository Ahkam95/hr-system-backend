# Human Resource Management System
Cloud based Human Resource Management System

## Prerequisites
1. Node 16
2. serverless 3 (npm install -g serverless)
3. MySql Workbench

## To run locally
1. Install dependancies
```bash
npm install
```

2. Pass the environment variables
```bash
export DB_DOMAIN="localhost"
export DB_USER=<>
export DB_PASSWORD=<>
export DATABASE="hrms"
```

3. Start the execution
```bash
npm start
```

## To deploy the Client to AWS

1. Login to AWS via CLI
```bash
aws configure
```
pass the Security Credential of the AWS account

2. Deploy
```bash
sls deploy
```