import {
    AmplifyProjectInfo,
    AmplifyRootStackTemplate
  } from '@aws-amplify/cli-extensibility-helper';
  
  export function override(
    resources: AmplifyRootStackTemplate,
    amplifyProjectInfo: AmplifyProjectInfo
  ) {
    const authRole = resources.authRole;
  
    const basePolicies = Array.isArray(authRole.policies)
      ? authRole.policies
      : [authRole.policies];
  
    authRole.policies = [
      ...basePolicies,
      {
        policyName: '',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: 'bedrock:InvokeModel',
              Resource:
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-v2'
            }
          ]
        }
      }
    ];
  }
