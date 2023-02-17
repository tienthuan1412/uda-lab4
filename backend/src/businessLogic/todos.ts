import * as uuid from 'uuid'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodosAccess } from '../dataLayer/todosAcess';
import { parseUserId } from '../auth/utils';
const logger = createLogger('todoAccess');
const todoAccess = new TodosAccess();
export async function createTodo(createTodoRequest: CreateTodoRequest,jwtToken: string): Promise<TodoItem> {
  logger.info('Create Todo now');
  const userOfId = parseUserId(jwtToken);
  const IdOfItem = uuid.v4();
  return await todoAccess.createTodo({
    userId: userOfId,
    todoId: IdOfItem,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false,
    createdAt: new Date().toISOString()
  })
}
export async function updateTodo(todoId: string,updateTodoRequest: UpdateTodoRequest,jwtToken: string): Promise<TodoUpdate> {
  logger.info('Go to update')
  const userOfId = parseUserId(jwtToken)
  return await todoAccess.updateTodo(userOfId,todoId,
    {
      name: updateTodoRequest.name,
      done: updateTodoRequest.done,
      dueDate: updateTodoRequest.dueDate,
    }
  )
}
export async function deleteTodo(todoId: string,jwtToken: string) 
{
  logger.info('Delete data');
  const userOfId = parseUserId(jwtToken);
  await todoAccess.deleteTodo(userOfId, todoId);
}
export async function getTodo(jwtToken: string): Promise<TodoItem[]> {
  logger.info('get all data Todo');
  const userOfId = parseUserId(jwtToken);
  return todoAccess.getTodo(userOfId);
}
export async function generateAndAddUploadUrl(todoId: string,jwtToken: string): Promise<string> {
  logger.info('generateAndAddUploadUrl information for Todo');
  const uploadUrl = todoAccess.getUploadUrl(todoId);
  const userOfId = parseUserId(jwtToken);
  await todoAccess.updateUrl(userOfId,todoId);
  return uploadUrl;
}
export async function todoExists(todoId: string,jwtToken: string): Promise<boolean> {
  logger.info('Checked had exist');
  const userOfId = parseUserId(jwtToken);
  return await todoAccess.todoExists(userOfId,todoId);
}
export async function searchTodo(jwtToken: string,contentSearch: string): Promise<TodoItem[]> {
  logger.info('Start Get all/search Todo');
  const userOfId = parseUserId(jwtToken);
  return todoAccess.searchTodo(userOfId, contentSearch);
}