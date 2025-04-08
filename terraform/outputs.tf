output "codedeploy_role_arn" {
  value = aws_iam_role.codedeploy_service.arn
}

output "ec2_role_arn" {
  value = aws_iam_role.ec2_instance.arn
}
