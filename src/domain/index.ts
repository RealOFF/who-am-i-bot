import { $Enums, type User as BaseUser } from '@prisma/client';

export const { TextRequestType } = $Enums;

export type User = BaseUser;
