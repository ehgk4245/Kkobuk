# AWS
variable "aws_region" {
  description = "AWS 리전"
  type        = string
}

variable "aws_access_key" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

# EC2
variable "ec2_key_pair" {
  description = "EC2 SSH 키페어 이름"
  type        = string
}

variable "ec2_instance_type" {
  description = "EC2 인스턴스 타입 (api, ai 서버)"
  type        = string
  default     = "t4g.micro"
}

variable "ec2_lb_instance_type" {
  description = "EC2 LB 인스턴스 타입"
  type        = string
  default     = "t4g.micro" # AWS 프리티어 nano 사용불가 나중에 nano로 변경
}

# RDS
variable "rds_username" {
  description = "RDS 마스터 사용자 이름"
  type        = string
  sensitive   = true
}

variable "rds_password" {
  description = "RDS 마스터 비밀번호"
  type        = string
  sensitive   = true
}

variable "rds_instance_class" {
  description = "RDS 인스턴스 클래스"
  type        = string
  default     = "db.t4g.micro"
}

# Redis
variable "redis_password" {
  description = "Redis 비밀번호"
  type        = string
  sensitive   = true
}

# S3
variable "s3_bucket_name" {
  description = "학습 데이터 및 모델 저장용 S3 버킷 이름"
  type        = string
}

# Lambda
variable "lambda_function_name" {
  description = "Lambda 학습 파이프라인 함수 이름"
  type        = string
}

# Domain
variable "domain_api" {
  description = "REST API 서버 도메인"
  type        = string
  default     = "api.kkobuk.site"
}

variable "domain_ai" {
  description = "AI 추론 서버 도메인"
  type        = string
  default     = "ai.kkobuk.site"
}
