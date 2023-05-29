# Human Resource Management System
Cloud based Human Resource Management System

## Prerequisites
1. Node 16
2. serverless 3 (npm install -g serverless)
3. MySql Database (setup RDS MySQL database)

## To run locally
1. Install dependancies
```bash
npm install
```

2. Pass the environment variables
```bash
export DB_DOMAIN="localhost"
export DATABASE="hrms"
export JWT_SECRET_KEY="jwt_secret"
export DB_USER=<>
export DB_PASSWORD=<>
```

3. Start the execution
```bash
npm start
```

## To deploy the the Lambda to AWS

1. Login to AWS via CLI
```bash
aws configure
```
pass the security Credential of the AWS account in your terminal

2. Deploy
```bash
sls deploy
```