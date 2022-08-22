import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'

interface FileStorageStackProps extends StackProps {
	authenticatedRole: iam.IRole
	unauthenticatedRole: iam.IRole
	allowedOrigins: string[]
}

export class FileStorageStack extends Stack {
	constructor(scope: Construct, id: string, props: FileStorageStackProps) {
		super(scope, id, props)

		const fileStorageBucket = new s3.Bucket(this, 's3-bucket', {
			removalPolicy: RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
			cors: [
				{
					allowedMethods: [
						s3.HttpMethods.GET,
						s3.HttpMethods.POST,
						s3.HttpMethods.PUT,
						s3.HttpMethods.DELETE,
					],
					allowedOrigins: props.allowedOrigins,
					allowedHeaders: ['*'],
				},
			],
		})

		// allow guests read access to the bucket.
		// fileStorageBucket.addToResourcePolicy(
		// 	new iam.PolicyStatement({
		// 		effect: iam.Effect.ALLOW,
		// 		actions: ['s3:GetObject'],
		// 		principals: [new iam.AnyPrincipal()],
		// 		resources: [`arn:aws:s3:::${fileStorageBucket.bucketName}/public/*`],
		// 	})
		// )

		const mangedPolicyForAmplifyUnauth = new iam.ManagedPolicy(
			this,
			'mangedPolicyForAmplifyUnauth',
			{
				description:
					'managed policy to allow usage of Storage Library for unauth',
				statements: [
					new iam.PolicyStatement({
						effect: iam.Effect.ALLOW,
						actions: ['s3:GetObject'],
						resources: [
							`arn:aws:s3:::${fileStorageBucket.bucketName}/public/*`,
						],
					}),
					new iam.PolicyStatement({
						effect: iam.Effect.ALLOW,
						actions: ['s3:GetObject'],
						resources: [
							`arn:aws:s3:::${fileStorageBucket.bucketName}/protected/*`,
						],
					}),
					new iam.PolicyStatement({
						effect: iam.Effect.ALLOW,
						actions: ['s3:ListBucket'],
						resources: [`arn:aws:s3:::${fileStorageBucket.bucketName}`],
						conditions: {
							StringLike: {
								's3:prefix': [
									'public/',
									'public/*',
									'protected/',
									'protected/*',
								],
							},
						},
					}),
				],
				roles: [props.unauthenticatedRole],
			}
		)

		const mangedPolicyForAmplifyAuth = new iam.ManagedPolicy(
			this,
			'mangedPolicyForAmplifyAuth',
			{
				description:
					'managed Policy to allow usage of storage library for auth',
				statements: [
					new iam.PolicyStatement({
						effect: iam.Effect.ALLOW,
						actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
						resources: [
							`arn:aws:s3:::${fileStorageBucket.bucketName}/public/*`,
						],
					}),
					new iam.PolicyStatement({
						effect: iam.Effect.ALLOW,
						actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
						resources: [
							`arn:aws:s3:::${fileStorageBucket.bucketName}/protected/\${cognito-identity.amazonaws.com:sub}/*`,
						],
					}),
					new iam.PolicyStatement({
						effect: iam.Effect.ALLOW,
						actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
						resources: [
							`arn:aws:s3:::${fileStorageBucket.bucketName}/private/\${cognito-identity.amazonaws.com:sub}/*`,
						],
					}),
					new iam.PolicyStatement({
						effect: iam.Effect.ALLOW,
						actions: ['s3:GetObject'],
						resources: [
							`arn:aws:s3:::${fileStorageBucket.bucketName}/protected/*`,
						],
					}),
					new iam.PolicyStatement({
						effect: iam.Effect.ALLOW,
						actions: ['s3:ListBucket'],
						resources: [`arn:aws:s3:::${fileStorageBucket.bucketName}`],
						conditions: {
							StringLike: {
								's3:prefix': [
									'public/',
									'public/*',
									'protected/',
									'protected/*',
									'private/${cognito-identity.amazonaws.com:sub}/',
									'private/${cognito-identity.amazonaws.com:sub}/*',
								],
							},
						},
					}),
				],
				roles: [props.authenticatedRole],
			}
		)

		new CfnOutput(this, 'BucketName', {
			value: fileStorageBucket.bucketName,
		})

		new CfnOutput(this, 'BucketRegion', {
			value: this.region,
		})
	}
}
