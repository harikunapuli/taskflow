pipeline {
    agent any

    environment {
        MYSQL_PASSWORD = credentials('mysql-password')
        JWT_SECRET_KEY = credentials('jwt-secret')
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
                sh 'pip install -r auth-service/requirements.txt'
                sh 'pytest auth-service/tests/ -v --tb=short'
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building Docker images...'
                sh 'docker-compose build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Starting all containers...'
                sh 'docker-compose up -d'
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