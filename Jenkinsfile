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

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Compute Image Tag') {
      steps {
        script {
          def shortSha = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
          env.IMAGE_TAG = "${shortSha}-${env.BUILD_NUMBER}"
        }
        echo "Image tag: ${env.IMAGE_TAG}"
      }
    }

    stage('Ensure ECR Repo Exists (idempotent)') {
      steps {
        withAWS(credentials: 'aws-ecr', region: "${env.AWS_REGION}") {
          sh """
            aws ecr describe-repositories --repository-names ${ECR_REPO} >/dev/null 2>&1 \
              || aws ecr create-repository --repository-name ${ECR_REPO} --image-tag-mutability IMMUTABLE \
                   --image-scanning-configuration scanOnPush=true
          """
        }
      }
    }

    stage('Login to ECR') {
      steps {
        withAWS(credentials: 'aws-ecr', region: "${env.AWS_REGION}") {
          sh 'aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY'
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t $IMAGE:$IMAGE_TAG .'
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
           sh '''
            aws lambda invoke \
             --function-name image-post-push \
              --payload '{"repository":"node-ecr","imageTag":"4fd94ba-9","image":"124931565674.dkr.ecr.us-east-1.amazonaws.com/node-ecr:4fd94ba-9"}' \
                /dev/null

           '''
        }
    }
    failure {
      echo "❌ Build failed"
    }
  }
}
