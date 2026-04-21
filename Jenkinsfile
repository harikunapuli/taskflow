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

        stage('Install Python') {
            steps {
                echo 'Installing Python and pip...'
                sh '''
                    apt-get update -y
                    apt-get install -y python3 python3-pip python3-venv
                    python3 --version
                    pip3 --version
                '''
            }
        }

        stage('Test') {
            steps {
                echo 'Running pytest...'
                sh '''
                    cd auth-service
                    pip3 install -r requirements.txt --break-system-packages
                    pip3 install pytest pytest-flask --break-system-packages
                    python3 -m pytest tests/ -v --tb=short
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building Docker images...'
                sh 'docker compose build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Starting all containers...'
                sh 'docker compose up -d'
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