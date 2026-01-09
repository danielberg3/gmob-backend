pipeline {
    agent {
        docker {
            image 'node:18-alpine'
        }
    }

    environment {
        SONAR_SCANNER_HOME = tool 'SonarScanner'
    }

    stages{
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQubeServer') {
                    sh "${SONAR_SCANNER_HOME}/bin/sonar-scanner -Dsonar.projectKey=my-nodejs-project -Dsonar.sources=."
                }
            }
        }

        stage ('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}