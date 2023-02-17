import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const logger = createLogger('TodosAccess')
const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS)

export class TodosAccess {
  constructor(private readonly docClient: DocumentClient = createDynamoDBClient(),private readonly s3 = new XAWS.S3({signatureVersion: 'v4'}),
    private readonly todoTable = process.env.TODOS_TABLE,
    private readonly dueDateIndex = process.env.TODOS_CREATED_AT_INDEX,
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION) {
  }
    async getTodo(userId: string): Promise<TodoItem[]> {
    logger.info('get all todo data')
    const res = await this.docClient.query({
      TableName: this.todoTable,
      IndexName: this.dueDateIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {':userId': userId},
      ScanIndexForward: true
    }).promise();
    const items = res.Items
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    logger.info('Create todo')
    await this.docClient.put({
      TableName: this.todoTable,
      Item: todo
    }).promise();
    return todo;
  }
  
  async updateTodo(userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<TodoUpdate> {
    logger.info('update todo');
    const params = {
      TableName: this.todoTable,
      Key: {
        todoId: todoId,
        userId: userId
      },
      UpdateExpression: 'set #todo_name = :name, dueDate = :dueDate, done = :done, priority = :priority',
      ExpressionAttributeNames: {
        '#todo_name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': todoUpdate.name,
        ':dueDate': todoUpdate.dueDate,
        ':done': todoUpdate.done,
      },
      ReturnValues: 'UPDATED_NEW'
    };
    await this.docClient.update(params).promise();
    return todoUpdate;
  }
  async searchTodo(userId: string, contentSearch: string): Promise<TodoItem[]> {
    if (!contentSearch) 
      logger.info('Get all todo data');
    else 
      logger.info('Start search todo');
    const res = await this.docClient.query({
      TableName: this.todoTable,
      IndexName: this.dueDateIndex,
      FilterExpression: 'contains(#name, :name)',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':name': contentSearch
      },
      ScanIndexForward: true
    }).promise();
    const items = res.Items;
    return items as TodoItem[];
  }
  async deleteTodo(userId: string, todoId: string) {
    logger.info('Delete todo', userId, todoId);
    const params = {
      TableName: this.todoTable,
      Key: {
        'todoId': todoId,
        'userId': userId
      }
    };
    await this.docClient.delete(params).promise();
  }
  async todoExists(userId: string, todoId: string): Promise<boolean> {
    logger.info('Checked todo exist');
    const params = {
      TableName: this.todoTable,
      Key: {
        todoId: todoId,
        userId: userId
      }
    };
    const res = await this.docClient.get(params).promise();
    return !!res.Item;
  }

  getUploadUrl(todoId: string) {
    logger.info('Start getUploadUrl')
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: parseInt(this.urlExpiration)
    });
  }

  async updateUrl(userId: string, todoId: string) {
    logger.info('Start updateUrl');
    const url = `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
    const params = {
      TableName: this.todoTable,
      Key: {
        todoId: todoId,
        userId: userId
      },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': url
      },
      ReturnValues: 'UPDATED_NEW'
    };
    await this.docClient.update(params).promise();
  }
}

function createDynamoDBClient() {
  logger.info('Start createDynamoDBClient')
  if (process.env.IS_OFFLINE) {
    logger.info('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  };
  return new XAWS.DynamoDB.DocumentClient();
}