resource "aws_lambda_function" "diagrams_test_lambda" {
  s3_bucket     = "godragons-diagrams-lambda"
  s3_key        = "first_lambda.zip"
  function_name = "diagrams_test_lambda"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "index.handler"

  depends_on = [aws_iam_role_policy_attachment.lambda_logs]

  # The filebase64sha256() function is available in Terraform 0.11.12 and later
  # For Terraform 0.11.11 and earlier, use the base64sha256() function and the file() function:
  # source_code_hash = "${base64sha256(file("lambda_function_payload.zip"))}"
  source_code_hash = filebase64sha256("../first_lambda/first_lambda.zip")

  runtime = "nodejs12.x"

  # environment {
  #   variables = {
  #     foo = "bar"
  #   }
  # }
}
