pipeline {
  agent any
  environment {
    AWS_REGION     = 'us-east-1'
    AWS_ACCOUNT_ID = '124931565674'
    ECR_REPO       = 'node-ecr'
    ECR_REGISTRY   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    IMAGE          = "${ECR_REGISTRY}/${ECR_REPO}"
  }
  options { timestamps() }

    agent any

    environment {
        AWS_REGION = 'us-east-1'
        ECR_REPO = 'node-ecr'
        ACCOUNT_ID = '124931565674'
        IMAGE_TAG = "${GIT_COMMIT}"   // use short commit hash
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker build -t $ECR_REPO:$IMAGE_TAG .
                """
            }
        }

        stage('Login to ECR') {
            steps {
                withAWS(region: "$AWS_REGION", credentials: 'aws-credentials-id') {
                    sh """
                        aws ecr get-login-password --region $AWS_REGION | \
                        docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
                    """
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                sh """
                    docker tag $ECR_REPO:$IMAGE_TAG $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
                    docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG
                """
            }
        }

        stage('Invoke Lambda') {
            steps {
                withAWS(region: "$AWS_REGION", credentials: 'aws-credentials-id') {
                    sh """
                        aws lambda invoke \
                        --function-name image-post-push \
                        --payload '{ "detail": { "repository-name": "$ECR_REPO", "image-tag": "$IMAGE_TAG" } }' \
                        /dev/null
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Docker image pushed and Lambda invoked successfully!"
        }
        failure {
            echo "❌ Build failed!"
        }
    }

    stage('Push Image') {
      steps {
        sh 'docker push $IMAGE:$IMAGE_TAG'
      }
    }
  }

  post {
    success {
      echo "✅ Pushed $IMAGE:$IMAGE_TAG"
      // Option B trigger (manual from Jenkins): uncomment if you prefer Jenkins->Lambda
         withAWS(credentials: 'aws-ecr', region: "${env.AWS_REGION}") {
           sh """
              cat > payload.json <<EOF
                    {
                "repository": "node-ecr",
                "imageTag": "${IMAGE_TAG}",
                "image": "${ECR_REPO}:${IMAGE_TAG}"
               }
               EOF

         aws lambda invoke --function-name image-post-push --payload file://payload.json /dev/null
             """
        }
    }
    failure {
      echo "❌ Build failed"
    }
  }
}
