output "ec2_api_public_ip" {
  description = "EC2 API 서버 공인 IP (GitHub Actions Secrets: EC2_API_HOST)"
  value       = aws_instance.api.public_ip
}

output "ec2_ai_public_ip" {
  description = "EC2 AI 서버 공인 IP (GitHub Actions Secrets: EC2_AI_HOST)"
  value       = aws_instance.ai.public_ip
}

output "rds_endpoint" {
  description = "RDS 엔드포인트 (포트 제외)"
  value       = aws_db_instance.mysql.address
}

output "ecr_api_url" {
  description = "ECR API 레포지토리 URL (GitHub Actions Secrets: ECR_REGISTRY)"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_ai_url" {
  description = "ECR AI 레포지토리 URL"
  value       = aws_ecr_repository.ai.repository_url
}

output "s3_bucket" {
  description = "S3 버킷 이름"
  value       = aws_s3_bucket.storage.bucket
}
