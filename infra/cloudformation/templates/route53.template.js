const data = {
  RecordProdWebsocketApi: {
    Type: "AWS::Route53::RecordSet",
    Properties: {
      AliasTarget: {
        DNSName: {
          "Fn::GetAtt": ["ProdWebsocketDomainName", "RegionalDomainName"],
        },
        EvaluateTargetHealth: false,
        HostedZoneId: {
          "Fn::GetAtt": ["ProdWebsocketDomainName", "RegionalHostedZoneId"],
        },
      },
      Name: "ws-diagrams.godragons.com",
      HostedZoneName: "godragons.com.",
      Type: "A",
    },
  },
  RecordProdRESTApi: {
    Type: "AWS::Route53::RecordSet",
    Properties: {
      AliasTarget: {
        DNSName: {
          "Fn::GetAtt": ["ProdRESTCustomDomainName", "RegionalDomainName"],
        },
        EvaluateTargetHealth: false,
        HostedZoneId: {
          "Fn::GetAtt": ["ProdRESTCustomDomainName", "RegionalHostedZoneId"],
        },
      },
      Name: "rest-diagrams.godragons.com",
      HostedZoneName: "godragons.com.",
      Type: "A",
    },
  },
};

module.exports = data;
