const AWS = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient()

async function main(event) {
	//construct the params
	const params = {
		TableName: process.env.TABLENAME,
		Item: {
			id: event.request.userAttributes.sub,
			firstname: event.request.userAttributes.name,
			lastname: event.request.userAttributes.family_name,
			username: event.userName,
			email: event.request.userAttributes.email,
		},
	}

	//try to add to the DB, otherwise throw an error
	try {
		await docClient.put(params).promise()
		return event
	} catch (err) {
		console.log(err)
		return event
	}
}

module.exports = { main }
