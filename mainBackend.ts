#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { AuthStack } from './lib/authStack'
import { FileStorageStack } from './lib/fileStorageStack'
import { DatabaseStack } from './lib/databaseStack'
import { APIStack } from './lib/apiStack'

const app = new cdk.App()

const databaseStack = new DatabaseStack(app, 'DatabaseStack', {})

const authStack = new AuthStack(app, 'AuthStack', {
	stage: 'dev',
	hasCognitoGroups: true,
	groupNames: ['admin'],
	userpoolConstructName: 'ChatUserPool',
	identitypoolConstructName: 'ChatIdentityPool',
	userTable: databaseStack.userTable,
})

const fileStorageStack = new FileStorageStack(app, 'FileStorageStack', {
	authenticatedRole: authStack.authenticatedRole,
	unauthenticatedRole: authStack.unauthenticatedRole,
	allowedOrigins: ['http://localhost:3000'],
})

const apiStack = new APIStack(app, 'AppSyncAPIStack', {
	userpool: authStack.userpool,
	roomTable: databaseStack.roomTable,
	messageTable: databaseStack.messageTable,
	userTable: databaseStack.userTable,
	unauthenticatedRole: authStack.unauthenticatedRole,
})
