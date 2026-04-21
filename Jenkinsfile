pipeline {
    agent any

    environment {
        MYSQL_PASSWORD   = credentials('mysql-password')
        JWT_SECRET_KEY   = credentials('jwt-secret')
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Pulling code from GitHub...'
                checkout scm
            }
        }

        stage('Test') {
            steps {
                echo 'Running pytest...'
                bat 'pip install -r auth-service/requirements.txt'
                bat 'pytest auth-service/tests/ --tb=short'
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building Docker images...'
                bat 'docker-compose build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Starting all containers...'
                bat 'docker-compose up -d'
            }
        }

    }

    post {
        success {
            echo 'Pipeline passed! All services are running.'
        }
        failure {
            echo 'Pipeline failed! Check the logs above.'
        }
    }
}