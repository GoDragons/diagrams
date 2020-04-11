

resource "aws_apigatewayv2_api" "diagrams" {
  name                       = "diagrams-websocket-api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}
