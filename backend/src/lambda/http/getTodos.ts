import 'source-map-support/register'
import { getTodo, searchTodo } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

const logger = createLogger('getTodoHandler')

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Processing event: ', event)

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const searchKeyword = event.queryStringParameters?.keyword

  let todo
  if (searchKeyword == undefined) {
    todo = await getTodo(jwtToken)
  } else {
    todo = await searchTodo(jwtToken, searchKeyword)
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      items: todo
    })
  }
}
