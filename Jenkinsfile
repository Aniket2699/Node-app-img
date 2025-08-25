pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        ECR_REPO  = 'node-ecr'
        LAMBDA_FN = 'image-post-push'
        IMAGE_TAG = ''
    }

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/Aniket2699/Node-app-img.git', branch: 'master'
            }
        }

        stage('Compute Image Tag') {
            steps {
                script {
                    IMAGE_TAG = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    echo "Image tag: ${IMAGE_TAG}"
                }
            }
        }

        stage('Ensure ECR Repository') {
            steps {
                withAWS(region: "${AWS_REGION}", credentials: 'aws-ecr') {
                    sh """
                    aws ecr describe-repositories --repository-names ${ECR_REPO} || \
                    aws ecr create-repository --repository-name ${ECR_REPO}
                    """
                }
            }
        }

        stage('Login to ECR') {
            steps {
                withAWS(region: "${AWS_REGION}", credentials: 'aws-ecr') {
                    sh 'aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin 124931565674.dkr.ecr.${AWS_REGION}.amazonaws.com'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t 124931565674.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG} ."
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    sh "docker push 124931565674.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}"
                }
            }
        }

        stage('Trigger Lambda') {
    steps {
        withAWS(region: "${AWS_REGION}", credentials: 'aws-ecr') {
            script {
                writeFile file: 'payload.json', text: """{
                  "repository": "${ECR_REPO}",
                  "imageTag": "${IMAGE_TAG}",
                  "image": "124931565674.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}"
                }"""
                sh """
                aws lambda invoke \
                --function-name ${LAMBDA_FN} \
                --cli-binary-format raw-in-base64-out \
                --payload file://payload.json \
                /dev/null
                """
                }
             }
          }
       }
    }

    post {
        success {
            echo "✅ Build and push succeeded: ${ECR_REPO}:${IMAGE_TAG}"
        }
        failure {
            echo "❌ Build failed"
        }
    }
}
