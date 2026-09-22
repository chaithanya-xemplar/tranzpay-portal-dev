#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TranzpayPortalStack } from '../lib/tranzpay-portal-stack';

const app = new cdk.App();

// Development environment
new TranzpayPortalStack(app, 'TranzpayPortalStack', {
  env: {
    account: '991862549203',
    region: 'us-east-1',
  },
  environment: 'dev',
});

// QA environment
new TranzpayPortalStack(app, 'TranzpayPortalStackQA', {
  env: {
    account: '991862549203',
    region: 'us-east-1',
  },
  environment: 'qa',
});
