import { Types } from 'mongoose';
import { IMessage } from '../interfaces/chat.interface';

type ObjectWithId = { _id: Types.ObjectId | string } | Types.ObjectId | string;

export const getObjectId = (item: ObjectWithId): Types.ObjectId | string => {
  if (item && typeof item === 'object' && '_id' in item) {
    return item._id;
  }
  return item as string;
};

export const checkAndUpdateChanges = (original: any, updated: any, changeHistoryData: any, field: string): void => {
  if (updated[field] && getObjectId(updated[field]).toString() !== getObjectId(original[field]).toString()) {
    changeHistoryData[`previous_${field}`] = original[field];
    changeHistoryData[`updated_${field}`] = getObjectId(updated[field]);
    original[field] = getObjectId(updated[field]);
  }
};

export const checkArrayChangesAndUpdate = (original: any, updated: any, changeHistoryData: any, field: string): void => {
  if (updated[field] && JSON.stringify(updated[field].map(getObjectId)) !== JSON.stringify(original[field].map((item: ObjectWithId) => getObjectId(item).toString()))) {
    changeHistoryData[`previous_${field}`] = original[field].map((item: ObjectWithId) => getObjectId(item));
    changeHistoryData[`updated_${field}`] = updated[field].map(getObjectId);
    original[field] = updated[field].map(getObjectId);
  }
};

export const messagesEqual = (msg1: IMessage, msg2: IMessage): boolean => {
  const keys: (keyof IMessage)[] = ['content', 'role', 'generated_by', 'step', 'assistant_name', 'context', 'type', 'request_type'];
  return keys.every(key => {
    const hasKey1 = key in msg1;
    const hasKey2 = key in msg2;
    if (hasKey1 !== hasKey2) {
      return false;
    }
    if (!hasKey1 && !hasKey2) {
      return true;
    }
    if (key === 'context') {
      return JSON.stringify(msg1[key]) === JSON.stringify(msg2[key]);
    }
    return msg1[key] === msg2[key];
  });
};

export function ensureObjectIdHelper(value: any): Types.ObjectId | any {
  if (value && typeof value === 'object' && '_id' in value) {
    return value._id;
  }
  return value;
}