import { SetMetadata } from '@nestjs/common';

export const MENU_CODE_KEY = 'menuCode';
export const MenuCode = (menuCode: string) => SetMetadata(MENU_CODE_KEY, menuCode);
