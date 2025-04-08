resource "aws_s3_bucket" "app_bucket" {
  bucket = "my-wonderwall-kafka-coupon-deploy-bucket"
  force_destroy = true  # 버킷 안에 객체 있어도 삭제 가능
}

resource "aws_s3_bucket_ownership_controls" "example" {
  bucket = aws_s3_bucket.app_bucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "example" {
  bucket = aws_s3_bucket.app_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

